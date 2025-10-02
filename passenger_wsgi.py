# 1. Абсолютный путь к папке вашего проекта.

project_path = '/var/www/u2886892/data/www/biotech-conversion.ru'

# 2. Абсолютный путь к папке с пакетами вашего виртуального окружения.
# Замените uXXXXXX, venv и python3.X на ваши значения.
venv_path = '/var/www/u2886892/data/www/biotech-conversion.ru/venv/lib/python3.9/site-packages'

# --------------------------

# Добавляем пути в системные пути Python
import sys
if venv_path not in sys.path:
    sys.path.insert(0, venv_path)

# Импорт приложения с перехватом ошибок
try:
    from app import app as application
except Exception:
    import traceback
    with open('error.log', 'a') as f:
        f.write('\n--- Restart ---\n')
        f.write(traceback.format_exc())
    def application(env, start_response):
        start_response('500 INTERNAL SERVER ERROR', [('Content-Type', 'text/plain')])
        return [b'Application failed to start. Check error.log']
