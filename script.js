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
    const headerHeight = document.querySelector('.header').offsetHeight;

    function highlightNavLink() {
        let index = sections.length;

        while(--index && window.scrollY + headerHeight < sections[index].offsetTop) {}
        
        navLinks.forEach((link) => link.classList.remove('active'));

        // Ensure there's a link to highlight
        const activeLink = document.querySelector(`.nav__list a.nav-link[href*="${sections[index].id}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Initial highlight
    highlightNavLink();
    // Highlight on scroll
    window.addEventListener('scroll', highlightNavLink);

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

    // Expansion Panels (Accordion) for multiple accordions
    const accordions = document.querySelectorAll('.specs-accordion');
    if (accordions.length > 0) {
        accordions.forEach(accordion => {
            const panels = accordion.querySelectorAll('.expansion-panel');
            panels.forEach(panel => {
                const header = panel.querySelector('.panel-header');
                header.addEventListener('click', () => {
                    // Optional: close other panels in the same accordion
                    /*
                    panels.forEach(otherPanel => {
                        if (otherPanel !== panel) {
                            otherPanel.classList.remove('active');
                        }
                    });
                    */
                    panel.classList.toggle('active');
                });
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

    // --- Логика Pop-up при уходе ---
    const exitOverlay = document.getElementById('exit-overlay');
    const exitCloseBtn = document.getElementById('exit-close-btn');
    const exitForm = document.getElementById('exitForm');

    if (exitOverlay && exitCloseBtn && exitForm) {
        const showExitPopup = () => {
            // Проверяем, был ли попап уже показан в этой сессии
            if (sessionStorage.getItem('exitPopupShown')) {
                return;
            }
            exitOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            sessionStorage.setItem('exitPopupShown', 'true'); // Отмечаем, что попап был показан
        };

        const closeExitPopup = () => {
            exitOverlay.style.display = 'none';
            document.body.style.overflow = '';
        };

        // Показываем попап, когда мышь уходит за пределы окна
        document.addEventListener('mouseout', (e) => {
            if (!e.relatedTarget && e.clientY < 10) {
                showExitPopup();
            }
        });

        // Закрытие по кнопке
        exitCloseBtn.addEventListener('click', closeExitPopup);

        // Закрытие по клику на оверлей
        exitOverlay.addEventListener('click', (e) => {
            if (e.target === exitOverlay) {
                closeExitPopup();
            }
        });

        // Обработка отправки формы
        exitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = exitForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(exitForm);
                const data = {
                    email: formData.get('email'),
                    type: 'Заявка на гайд (уход с сайта)',
                    name: 'Пользователь (уход с сайта)' // Добавляем имя по умолчанию
                };

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    exitForm.parentElement.style.display = 'none';
                    document.querySelector('.exit-modal-thanks').style.display = 'block';
                    setTimeout(closeExitPopup, 3000);
                } else {
                    const result = await response.json();
                    showNotification(result.error || 'Ошибка при отправке', 'error');
                    submitBtn.textContent = 'Скачать гайд';
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error('Ошибка при отправке формы ухода:', error);
                showNotification('Не удалось отправить данные.', 'error');
                submitBtn.textContent = 'Скачать гайд';
                submitBtn.disabled = false;
            }
        });
    }
    
    // --- Логика квиза на странице ---
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        const steps = quizContainer.querySelectorAll('.quiz-step');
        const progressBar = quizContainer.querySelector('.quiz-progress-bar');
        const form = document.getElementById('quizFormPage');
        const sphereInput = document.getElementById('quiz-project-sphere');
        const stageInput = document.getElementById('quiz-project-stage');

        let currentStep = 1;
        const totalSteps = 3; // 2 вопроса + 1 форма

        const goToStep = (stepNumber) => {
            steps.forEach(step => step.classList.remove('active'));
            const targetStep = quizContainer.querySelector(`.quiz-step[data-step="${stepNumber}"]`);
            if (targetStep) {
                targetStep.classList.add('active');
                currentStep = stepNumber;
                
                // Обновляем прогресс-бар
                const progress = (currentStep <= totalSteps) ? ((currentStep - 1) / totalSteps) * 100 + (100 / totalSteps) : 100;
                progressBar.style.width = `${progress}%`;
            }
        };

        quizContainer.addEventListener('click', (e) => {
            if (e.target.matches('.quiz-option-btn')) {
                const nextStep = parseInt(e.target.dataset.next, 10);
                const value = e.target.dataset.value;
                const currentStepElem = e.target.closest('.quiz-step');
                const stepNumber = parseInt(currentStepElem.dataset.step, 10);

                // Сохраняем значение
                if (stepNumber === 1) {
                    sphereInput.value = value;
                } else if (stepNumber === 2) {
                    stageInput.value = value;
                }

                // Убираем класс selected у всех кнопок в этой группе
                currentStepElem.querySelectorAll('.quiz-option-btn').forEach(btn => btn.classList.remove('selected'));
                // Добавляем класс selected нажатой кнопке
                e.target.classList.add('selected');

                // Плавный переход
                setTimeout(() => goToStep(nextStep), 300);
            }
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    project_sphere: formData.get('project_sphere'),
                    project_stage: formData.get('project_stage'),
                    type: 'Квиз (со страницы)'
                };

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    goToStep('thanks');
                } else {
                    const result = await response.json();
                    showNotification(result.error || 'Ошибка при отправке', 'error');
                }
            } catch (error) {
                console.error('Ошибка при отправке квиза:', error);
                showNotification('Не удалось отправить данные.', 'error');
            } finally {
                submitBtn.textContent = 'Получить результат и чек-лист';
                submitBtn.disabled = false;
            }
        });
    }
});
