document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
    const body = document.body;

    const applyTheme = (theme) => {
        body.classList.toggle('dark-theme', theme === 'dark');
        themeToggleBtns.forEach(btn => {
            btn.querySelector('.material-symbols-outlined').textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        });
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    });

    // Sticky Header on Scroll
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Active Link Highlighting on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__list a.nav-link');

    const observer = new IntersectionObserver((entries) => {
        let activeSectionId = null;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!activeSectionId) { // Only set the first intersecting section as active
                    activeSectionId = entry.target.id;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            // Match '/#section' or '#section'
            const linkSectionId = href.substring(href.lastIndexOf('#') + 1);

            if (linkSectionId === activeSectionId) {
                link.classList.add('active');
            }
        });

        // Special case for home link
        const homeLink = document.querySelector('.nav__list a.nav-link[href="/"]');
        if (homeLink) {
             // If no section is active and we are near the top, highlight home
            if (!activeSectionId && window.scrollY < 200) {
                 navLinks.forEach(link => link.classList.remove('active')); // Clear all
                homeLink.classList.add('active');
            } else if (activeSectionId) {
                homeLink.classList.remove('active');
            }
        }

    }, { rootMargin: '-40% 0px -60% 0px' });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Mobile Navigation
    const navMenu = document.getElementById('nav-menu'),
          navToggle = document.getElementById('nav-toggle'),
          navClose = document.getElementById('nav-close');

    if(navToggle) {
        navToggle.addEventListener('click', () =>{
            navMenu.classList.add('show-menu');
        });
    }

    if(navClose) {
        navClose.addEventListener('click', () =>{
            navMenu.classList.remove('show-menu');
        });
    }

    // Expansion Panels (Accordion)
    const accordion = document.querySelector('.specs-accordion');
    if (accordion) {
      const panels = accordion.querySelectorAll('.expansion-panel');
      panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        header.addEventListener('click', () => {
          panel.classList.toggle('active');
        });
      });
    }

    // --- Функция загрузки новостей ---
    async function loadNews() {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        // Определяем, находимся ли мы на главной странице
        const isHomePage = document.body.classList.contains('home-page');

        try {
            // Запрос к файлу news.json
            const response = await fetch('/news.json'); // Используем абсолютный путь
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let allNews = await response.json();

            // Функция для рендеринга новостей
            const renderNews = (newsList) => {
                newsContainer.innerHTML = ''; // Очистка контейнера

                if (newsList.length === 0) {
                    newsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Новостей по данному фильтру нет.</p>';
                    return;
                }

                // На главной странице показываем только 3 новости
                const newsToRender = isHomePage ? newsList.slice(0, 3) : newsList;

                if (newsToRender.length === 0 && !isHomePage) {
                     newsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Новостей пока нет.</p>';
                     return;
                }


                newsToRender.forEach(news => {
                    const newsCard = document.createElement('article');
                    newsCard.className = 'news-card';
                    // Добавляем обработчик клика на всю карточку
                    newsCard.addEventListener('click', () => {
                        window.location.href = `/news/${news.slug}/`;
                    });

                    // Форматирование даты
                    const date = new Date(news.date);
                    const formattedDate = date.toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    // Создаем HTML для тегов, если они есть
                    let tagsHTML = '';
                    if (news.tags && news.tags.length > 0) {
                        tagsHTML = news.tags.map(tag => `<span class="chip chip-assist">#${tag}</span>`).join('');
                    }

                    // Создаем HTML для изображения, если оно есть
                    let imageHTML = '';
                    if (news.image) {
                        imageHTML = `<img src="/uploads/${news.image}" alt="${news.title}" class="news-card__image">`;
                    }

                    // Создаем HTML для ссылки на документ, если он есть
                    let documentHTML = '';
                    if (news.document) {
                        const docPath = news.document.startsWith('pdf/') ? news.document : `pdf/${news.document}`;
                        documentHTML = `<a href="/uploads/${docPath}" class="icon-btn-news ripple-container" download onclick="event.stopPropagation();"><span class="material-symbols-outlined">download</span></a>`;
                    }

                    // Обрезаем текст до 120 символов
                    const shortContent = news.content.replace(/<br>/g, ' ').substring(0, 120) + '...';
                    const primaryTag = news.primary_tag || 'Наука';

                    newsCard.innerHTML = `
                        <div class="news-card__content-wrapper">
                            <div class="news-card__header">
                                <span class="chip chip-category">${primaryTag}</span>
                                <time class="news-date" datetime="${news.date}">${formattedDate}</time>
                            </div>
                            ${imageHTML}
                            <div class="news-card__content">
                                <h3 class="news-title"><a href="/news/${news.slug}/">${news.title}</a></h3>
                                <p class="news-excerpt">${shortContent}</p>
                            </div>
                            <hr class="divider">
                            <div class="news-card__footer">
                                <div class="news-tags">
                                    ${tagsHTML}
                                </div>
                                <div class="news-actions">
                                    ${documentHTML}
                                </div>
                            </div>
                        </div>
                    `;
                    newsContainer.appendChild(newsCard);
                });
                 // Добавляем Ripple-эффект ко всем кнопкам после их создания
                addRippleEffect();
            };

            // Изначальный рендер всех (или 3-х) новостей
            renderNews(allNews);

            // --- Логика фильтрации ---
            const filterChips = document.querySelectorAll('.filter-chip');
            filterChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    // Управление активным состоянием кнопок
                    filterChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');

                    const filter = chip.dataset.filter;
                    if (filter === 'all') {
                        renderNews(allNews);
                    } else {
                        const filteredNews = allNews.filter(news => (news.primary_tag || '').toLowerCase() === filter.toLowerCase());
                        renderNews(filteredNews);
                    }
                });
            });

        } catch (error) {
            console.error('Ошибка при загрузке новостей:', error);
            newsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Не удалось загрузить новости. Попробуйте позже.</p>';
        }
    }

    // Запускаем загрузку новостей
    loadNews();

    // --- Функция для Ripple-эффекта ---
    function addRippleEffect() {
        const buttons = document.querySelectorAll('.btn, .icon-btn, .filter-chip, .news-card__link');

        buttons.forEach(button => {
            // Добавляем класс-контейнер
            button.classList.add('ripple-container');

            button.addEventListener('click', function (e) {
                const rect = button.getBoundingClientRect();
                const circle = document.createElement('span');
                const diameter = Math.max(button.clientWidth, button.clientHeight);
                const radius = diameter / 2;

                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - rect.left - radius}px`;
                circle.style.top = `${e.clientY - rect.top - radius}px`;
                circle.classList.add('ripple');

                const ripple = button.getElementsByClassName('ripple')[0];

                if (ripple) {
                    ripple.remove();
                }

                button.appendChild(circle);
            });
        });
    }

    // Применяем эффект к кнопкам, которые уже есть на странице
    addRippleEffect();

    // --- Обработка формы обратной связи ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Показываем состояние загрузки
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(contactForm);
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    message: formData.get('message')
                };
                
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Показываем успешное сообщение
                    showNotification(result.message, 'success');
                    contactForm.reset();
                } else {
                    // Показываем ошибку
                    showNotification(result.error || 'Произошла ошибка при отправке', 'error');
                }
                
            } catch (error) {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при отправке сообщения', 'error');
            } finally {
                // Восстанавливаем кнопку
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Функция для показа уведомлений ---
    function showNotification(message, type = 'info') {
        // Удаляем существующие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
                <span>${message}</span>
            </div>
        `;
        
        // Добавляем стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)'};
            color: ${type === 'success' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-error)'};
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Автоматически удаляем через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
});
