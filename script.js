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
          navToggle = document.getElementById('nav-toggle');

    if(navToggle) {
        navToggle.addEventListener('click', () =>{
            navMenu.classList.toggle('show-menu');
        });
    }

    // Close menu when a link is clicked
    const closeMenu = () => {
        navMenu.classList.remove('show-menu');
    }
    const navLinksMobile = document.querySelectorAll('.nav__list .nav-link');
    navLinksMobile.forEach(link => link.addEventListener('click', closeMenu));

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

    // --- Глобальная функция отправки данных в Make.com ---
    async function sendToMake(data) {
        // !!! ЗАМЕНИТЕ ЭТОТ URL НА ВАШ WEBHOOK ИЗ MAKE.COM !!!
        const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/nqtjwvfgxep3pcaasdbonzwsbw7s8f6r'; 
        
        try {
            await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // Оставляем этот режим для обхода CORS
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // В режиме 'no-cors' мы не можем проверить успешность ответа от сервера.
            // Мы предполагаем, что запрос был отправлен, и показываем пользователю сообщение об успехе.
            // Для отладки проверяйте историю выполнения сценария в Make.com.
            console.log('Данные отправлены в Make.com. Проверьте историю сценария для подтверждения.');
            return { success: true, message: 'Заявка успешно отправлена!' };

        } catch (error) {
            // Этот блок сработает только при ошибках сети (например, если нет интернета).
            console.error('Fetch error:', error);
            return { success: false, error: 'Ошибка сети. Не удалось отправить данные.' };
        }
    }


    // --- Обработка формы обратной связи ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            
            const formData = new FormData(contactForm);
            const data = {
                type: 'Заявка на консультацию',
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email')
            };
            
            const result = await sendToMake(data);
            
            if (result.success) {
                showNotification('Спасибо! Мы скоро с вами свяжемся.', 'success');
                contactForm.reset();
            } else {
                showNotification(result.error, 'error');
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    // --- Функция для показа уведомлений ---
    function showNotification(message, type = 'info') {
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

            const formData = new FormData(exitForm);
            const data = {
                type: 'Заявка на гайд (уход с сайта)',
                email: formData.get('email'),
                name: 'Пользователь (уход с сайта)'
            };

            const result = await sendToMake(data);

            if (result.success) {
                exitForm.parentElement.style.display = 'none';
                document.querySelector('.exit-modal-thanks').style.display = 'block';
                setTimeout(closeExitPopup, 3000);
            } else {
                showNotification(result.error || 'Ошибка при отправке', 'error');
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

            const formData = new FormData(form);
            const data = {
                type: 'Квиз (со страницы)',
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                project_sphere: formData.get('project_sphere'),
                project_stage: formData.get('project_stage')
            };

            const result = await sendToMake(data);

            if (result.success) {
                goToStep('thanks');
            } else {
                showNotification(result.error || 'Ошибка при отправке', 'error');
            }
           
            submitBtn.textContent = 'Получить результат и чек-лист';
            submitBtn.disabled = false;
        });
    }
});
