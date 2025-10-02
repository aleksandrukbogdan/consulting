import os
import json
import shutil
import re
import requests
from flask import Flask, render_template, request, redirect, url_for, session, abort, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from slugify import slugify

# --- Определение абсолютного пути к проекту ---
basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, static_folder='.', template_folder='templates')
# Секретный ключ для сессий. В реальном проекте его лучше генерировать случайно.
app.secret_key = 'your_very_secret_key'

# --- Конфигурация ---
# Папка для загружаемых файлов
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
UPLOAD_FOLDER_IMG = os.path.join(UPLOAD_FOLDER, 'img')
UPLOAD_FOLDER_DOC = os.path.join(UPLOAD_FOLDER, 'pdf')
NEWS_FOLDER = os.path.join(basedir, 'news')
ALLOWED_EXTENSIONS_IMG = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_EXTENSIONS_DOC = {'pdf', 'doc', 'docx', 'txt'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_FOLDER_IMG'] = UPLOAD_FOLDER_IMG
app.config['UPLOAD_FOLDER_DOC'] = UPLOAD_FOLDER_DOC

NEWS_FILE = os.path.join(basedir, 'news.json')
PRIMARY_TAGS = ['Экология', 'Химия', 'Образование', 'Промышленность', 'Наука']

# Make.com webhook URL - замените на ваш URL
MAKE_WEBHOOK_URL = os.getenv('MAKE_WEBHOOK_URL', 'https://hook.eu2.make.com/wty94nrg0s9fh7bo6lxdnhxwj99ivmhx')

MONTHS_RU = {
    1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля', 5: 'мая', 6: 'июня',
    7: 'июля', 8: 'августа', 9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря'
}

# --- Функции-помощники ---

def format_date_ru(date_obj):
    """Форматирует дату в строку 'ДД месяц ГГГГ' на русском."""
    day = date_obj.day
    month = MONTHS_RU.get(date_obj.month, '')
    year = date_obj.year
    return f"{day} {month} {year}"

def create_slug(title):
    """Создает URL-дружелюбную строку из заголовка."""
    s = title.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s

def allowed_file(filename, allowed_extensions):
    """Проверяет, является ли расширение файла допустимым."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_news():
    """Читает новости из JSON файла."""
    if not os.path.exists(NEWS_FILE):
        return []
    with open(NEWS_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return [] # Возвращаем пустой список, если файл пуст или некорректен

def save_news(news_data):
    """Сохраняет новости в JSON файл."""
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=4)

# --- Маршруты (Routes) ---

@app.route('/')
def index():
    """Главная страница."""
    return render_template('index.html')

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Отдает загруженные файлы."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Добавляем маршрут для обслуживания сгенерированных новостных страниц
@app.route('/news/')
def news_list():
    """Страница со списком всех новостей."""
    return render_template('news_list.html')

@app.route('/news/<path:path>')
def serve_news(path):
    """Отдает статические файлы из папки news."""
    abs_path = os.path.join(NEWS_FOLDER, path)

    if os.path.isdir(abs_path):
        path = os.path.join(path, 'index.html')

    return send_from_directory(NEWS_FOLDER, path)


@app.route('/<path:filename>')
def serve_static(filename):
    """Отдает статические файлы (css, js, images, etc.)."""
    # Исключаем маршрут uploads и news, так как они обрабатываются отдельно
    if filename.startswith('uploads/') or filename.startswith('news/') or filename == 'admin':
        abort(404)
    return send_from_directory(basedir, filename)


@app.route('/admin', methods=['GET', 'POST'])
def admin():
    """Страница администратора: вход и управление новостями."""
    if request.method == 'POST':
        # --- Логика входа ---
        if 'password' in request.form:
            if request.form['password'] == 'password':
                session['loggedin'] = True
                return redirect(url_for('admin'))
            else:
                return render_template('admin.html', login_error='Неверный пароль!')

        # --- Логика добавления новости ---
        if session.get('loggedin'):
            title = request.form.get('title')
            slug_input = request.form.get('slug')
            content = request.form.get('content')
            tags_string = request.form.get('tags', '')
            primary_tag = request.form.get('primary_tag')

            if title and content:
                image_filename = None
                doc_filename = None

                # --- Обработка загрузки изображения ---
                if 'image' in request.files:
                    file = request.files['image']
                    if file and file.filename != '' and allowed_file(file.filename, ALLOWED_EXTENSIONS_IMG):
                        filename = secure_filename(file.filename)
                        img_dir = app.config['UPLOAD_FOLDER_IMG']
                        os.makedirs(img_dir, exist_ok=True)
                        file.save(os.path.join(img_dir, filename))
                        image_filename = f'img/{filename}'

                # --- Обработка загрузки документа ---
                if 'document' in request.files:
                    file = request.files['document']
                    if file and file.filename != '' and allowed_file(file.filename, ALLOWED_EXTENSIONS_DOC):
                        filename = secure_filename(file.filename)
                        doc_dir = app.config['UPLOAD_FOLDER_DOC']
                        os.makedirs(doc_dir, exist_ok=True)
                        file.save(os.path.join(doc_dir, filename))
                        doc_filename = f'pdf/{filename}'

                news_list = get_news()
                import datetime
                import uuid

                slug = slugify(slug_input) if slug_input else slugify(title)
                tags = [tag.strip() for tag in tags_string.split(',') if tag.strip()]
                date_obj = datetime.datetime.now()

                # Форматируем контент: заменяем двойные переносы строк на параграфы
                paragraphs = content.strip().split('\n\n')
                formatted_content = "".join("<p>" + p.replace('\n', '<br>') + "</p>" for p in paragraphs)

                new_entry = {
                    'id': str(uuid.uuid4()),
                    'title': title,
                    'content': formatted_content,
                    'tags': tags,
                    'image': image_filename,
                    'document': doc_filename,
                    'date': date_obj.strftime('%Y-%m-%d %H:%M:%S'),
                    'slug': slug,
                    'primary_tag': primary_tag
                }
                
                # --- Генерация HTML страницы ---
                news_path = os.path.join(NEWS_FOLDER, slug)
                os.makedirs(news_path, exist_ok=True)
                
                date_obj = datetime.datetime.now()
                formatted_date = format_date_ru(date_obj)
                
                rendered_html = render_template(
                    'news_post.html', 
                    title=title, 
                    content=new_entry['content'],
                    image=image_filename,
                    document=doc_filename,
                    tags=tags,
                    date=new_entry['date'],
                    formatted_date=formatted_date,
                    primary_tag=primary_tag
                )
                
                with open(os.path.join(news_path, 'index.html'), 'w', encoding='utf-8') as f:
                    f.write(rendered_html)
                # --- Конец генерации ---

                news_list.insert(0, new_entry)
                save_news(news_list)
                return redirect(url_for('admin'))

    if session.get('loggedin'):
        news_list = get_news()
        return render_template('admin.html', news_list=news_list, primary_tags=PRIMARY_TAGS)
    else:
        return render_template('admin.html')

@app.route('/admin/delete/<news_id>')
def delete_news(news_id):
    """Удаление новости и связанных файлов."""
    if not session.get('loggedin'):
        abort(403)
    
    news_list = get_news()
    news_to_delete = next((news for news in news_list if news['id'] == news_id), None)

    if news_to_delete:
        # Удаление файлов и директории
        if news_to_delete.get('image'):
            try:
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], *news_to_delete['image'].split('/'))
                os.remove(image_path)
            except OSError: pass
        if news_to_delete.get('document'):
            try:
                document_path = os.path.join(app.config['UPLOAD_FOLDER'], *news_to_delete['document'].split('/'))
                os.remove(document_path)
            except OSError: pass
        if news_to_delete.get('slug'):
            try: shutil.rmtree(os.path.join(NEWS_FOLDER, news_to_delete['slug']))
            except OSError: pass
        
        # Удаление записи из списка
        news_list = [news for news in news_list if news['id'] != news_id]
        save_news(news_list)

    return redirect(url_for('admin'))

@app.route('/admin/regenerate')
def regenerate_news_files():
    """
    Временный маршрут для пересоздания всех статических HTML-файлов новостей.
    """
    if not session.get('loggedin'):
        return redirect(url_for('admin'))

    try:
        import datetime
        news_list = get_news()
        for news_item in news_list:
            slug = news_item.get('slug')
            if not slug:
                continue

            date_obj = datetime.datetime.strptime(news_item['date'], '%Y-%m-%d %H:%M:%S')
            formatted_date = format_date_ru(date_obj)

            news_path = os.path.join(NEWS_FOLDER, slug)
            os.makedirs(news_path, exist_ok=True)

            # Форматируем контент для перегенерации
            paragraphs = news_item['content'].strip().split('\n\n')
            formatted_content = "".join("<p>" + p.replace('\n', '<br>') + "</p>" for p in paragraphs)
            
            rendered_html = render_template(
                'news_post.html',
                title=news_item['title'],
                content=formatted_content, # Используем отформатированный контент
                image=news_item.get('image'),
                document=news_item.get('document'),
                tags=news_item['tags'],
                date=news_item['date'],
                formatted_date=formatted_date,
                primary_tag=news_item.get('primary_tag')
            )

            with open(os.path.join(news_path, 'index.html'), 'w', encoding='utf-8') as f:
                f.write(rendered_html)

        return "Все новостные страницы были успешно пересозданы! <a href='/admin'>Вернуться в админ-панель</a>"
    except Exception as e:
        return f"Произошла ошибка при пересоздании файлов: {str(e)}"


@app.route('/admin/logout')
def logout():
    """Выход из админ-панели."""
    session.pop('loggedin', None)
    return redirect(url_for('admin'))

@app.route('/api/contact', methods=['POST'])
def contact_form():
    """Обработка формы обратной связи и отправка в Make.com."""
    try:
        data = request.get_json()
        
        # Валидация данных
        if not data or not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({'success': False, 'error': 'Все поля обязательны для заполнения'}), 400
        
        # Подготовка данных для отправки в Make.com
        webhook_data = {
            'name': data.get('name'),
            'email': data.get('email'),
            'message': data.get('message')
            
        }
        
        # Отправка в Make.com
        response = requests.post(
            MAKE_WEBHOOK_URL,
            json=webhook_data,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            return jsonify({'success': True, 'message': 'Сообщение успешно отправлено!'})
        else:
            return jsonify({'success': False, 'error': 'Ошибка при отправке сообщения'}), 500
            
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': 'Ошибка соединения с сервисом'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': 'Внутренняя ошибка сервера'}), 500

if __name__ == '__main__':
    for folder in [UPLOAD_FOLDER, NEWS_FOLDER, UPLOAD_FOLDER_IMG, UPLOAD_FOLDER_DOC]:
        if not os.path.exists(folder):
            os.makedirs(folder)
    app.run(debug=True, port=8000)
