const state = { data: null, activeFilter: 'All' };

const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Data layer: keep content separate from the presentation.
async function loadPortfolioData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Data portfolio tidak ditemukan.');
        state.data = await response.json();
        renderPortfolio(state.data);
    } catch (error) {
        console.error(error);
        document.body.classList.add('load-error');
        qs('#aboutText').textContent = 'Konten belum dapat dimuat. Silakan jalankan halaman melalui local server.';
    } finally {
        window.setTimeout(() => qs('#preloader')?.classList.add('is-hidden'), 450);
    }
}

function renderPortfolio(data) {
    const { profile, skills, projects, experience, education, contact } = data;
    qs('#profilePhoto').src = profile.photo;
    qs('#profilePhoto').alt = `Foto profil ${profile.name}`;
    qs('#cvButton').href = profile.cvLink;
    qs('#typedText').dataset.text = profile.tagline;
    qs('#aboutText').textContent = profile.about;
    qs('#socialLinks').innerHTML = profile.socials.map(social => `<a href="${social.url}" target="_blank" rel="noopener" aria-label="${social.name}"><i class="${social.icon}"></i></a>`).join('');
    qs('#statsGrid').innerHTML = `<div class="stat"><strong data-count="6">0</strong><span>Tahun pengalaman</span></div><div class="stat"><strong data-count="42">0</strong><span>Proyek selesai</span></div><div class="stat"><strong data-count="12">0</strong><span>Penghargaan</span></div>`;
    renderSkills(skills);
    renderProjects(projects);
    renderTimeline('#experienceTimeline', experience, item => `<strong>${item.title}</strong><span>${item.company}</span><p>${item.description}</p>`);
    renderTimeline('#educationTimeline', education, item => `<strong>${item.degree}</strong><span>${item.school}</span><p>${item.description}</p>`);
    qs('#contactDetails').innerHTML = `<a href="mailto:${contact.email}"><i class="fa-regular fa-envelope"></i><span>${contact.email}</span></a><a href="tel:${contact.phone.replaceAll(' ', '')}"><i class="fa-solid fa-phone"></i><span>${contact.phone}</span></a><p><i class="fa-solid fa-location-dot"></i><span>${contact.location}</span></p>`;
    qs('#copyright').textContent = `© ${new Date().getFullYear()} ${profile.name}. Dibuat dengan niat baik.`;
    startTyping(profile.tagline);
    observeCounters();
}

function renderSkills(skills) {
    const categories = [{ key: 'frontend', label: 'Frontend', icon: 'fa-solid fa-code' }, { key: 'backend', label: 'Backend', icon: 'fa-solid fa-server' }, { key: 'tools', label: 'Tools', icon: 'fa-solid fa-wand-magic-sparkles' }];
    qs('#skillsGrid').innerHTML = categories.map(category => `<article class="skill-card"><div class="skill-card-head"><span class="skill-icon"><i class="${category.icon}"></i></span><h3>${category.label}</h3></div>${skills[category.key].map(skill => `<div class="skill-item"><div class="skill-label"><span>${skill.name}</span><strong>${skill.level}%</strong></div><div class="progress-track"><span class="progress-bar" data-level="${skill.level}"></span></div></div>`).join('')}</article>`).join('');
    window.setTimeout(() => qsa('.progress-bar').forEach(bar => { bar.style.width = `${bar.dataset.level}%`; }), 300);
}

function renderProjects(projects) {
    const categories = ['All', ...new Set(projects.map(project => project.category))];
    qs('#projectFilters').innerHTML = categories.map((category, index) => `<button class="filter-button ${index === 0 ? 'active' : ''}" data-filter="${category}" role="tab" aria-selected="${index === 0}">${category}</button>`).join('');
    qs('#projectFilters').addEventListener('click', event => { const button = event.target.closest('.filter-button'); if (!button) return; state.activeFilter = button.dataset.filter; qsa('.filter-button').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-selected', item === button); }); renderProjectCards(projects); });
    renderProjectCards(projects);
}

function renderProjectCards(projects) {
    const visibleProjects = state.activeFilter === 'All' ? projects : projects.filter(project => project.category === state.activeFilter);
    qs('#projectsGrid').innerHTML = visibleProjects.map(project => `<article class="project-card reveal is-visible"><button class="project-image" data-project-id="${project.id}" aria-label="Lihat detail ${project.title}"><img src="${project.image}" alt="Preview proyek ${project.title}" loading="lazy"><span class="project-arrow"><i class="fa-solid fa-arrow-up-right-from-square"></i></span></button><div class="project-info"><p class="project-category">${project.category}</p><h3>${project.title}</h3><p>${project.description}</p><button class="text-button" data-project-id="${project.id}">Lihat detail <i class="fa-solid fa-arrow-right"></i></button></div></article>`).join('');
    qsa('[data-project-id]').forEach(button => button.addEventListener('click', () => openProjectModal(Number(button.dataset.projectId))));
}

function renderTimeline(selector, items, markup) { qs(selector).innerHTML = items.map(item => `<article class="timeline-item"><span class="timeline-year">${item.year}</span><div class="timeline-content">${markup(item)}</div></article>`).join(''); }

function openProjectModal(id) {
    const project = state.data.projects.find(item => item.id === id); if (!project) return;
    qs('#modalImage').src = project.image; qs('#modalImage').alt = `Preview ${project.title}`; qs('#modalCategory').textContent = project.category; qs('#modalTitle').textContent = project.title; qs('#modalDescription').textContent = project.description; qs('#modalTech').innerHTML = project.tech.map(item => `<span>${item}</span>`).join(''); qs('#modalDemo').href = project.demoUrl; qs('#modalRepo').href = project.repoUrl;
    qs('#projectModal').classList.add('is-open'); qs('#projectModal').setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); qs('.modal-close').focus();
}
function closeProjectModal() { qs('#projectModal').classList.remove('is-open'); qs('#projectModal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }

function startTyping(text) { const target = qs('#typedText'); let index = 0; let deleting = false; const type = () => { target.textContent = deleting ? text.slice(0, index--) : text.slice(0, index++); if (!deleting && index > text.length) { deleting = true; return window.setTimeout(type, 2200); } if (deleting && index < 0) { deleting = false; index = 0; } window.setTimeout(type, deleting ? 45 : 75); }; type(); }
function observeCounters() { const counters = qsa('[data-count]'); const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (!entry.isIntersecting || entry.target.dataset.done) return; entry.target.dataset.done = 'true'; const target = Number(entry.target.dataset.count); let value = 0; const timer = window.setInterval(() => { value += 1; entry.target.textContent = `${value}${target === 6 ? '+' : ''}`; if (value >= target) window.clearInterval(timer); }, 50); }); }, { threshold: 0.6 }); counters.forEach(counter => observer.observe(counter)); }
function setupReveal() { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }), { threshold: 0.12 }); qsa('.reveal').forEach(element => observer.observe(element)); }
function setupNavigation() { const header = qs('.site-header'); const menuToggle = qs('#menuToggle'); const menu = qs('#mainMenu'); menuToggle.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); menuToggle.setAttribute('aria-expanded', open); menuToggle.innerHTML = `<i class="fa-solid fa-${open ? 'xmark' : 'bars'}"></i>`; }); qsa('#mainMenu a').forEach(link => link.addEventListener('click', () => { menu.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'; })); qs('#themeToggle').addEventListener('click', toggleTheme); const savedTheme = localStorage.getItem('portfolio-theme'); if (savedTheme === 'light') document.body.classList.add('light-theme'); window.addEventListener('scroll', () => { header.classList.toggle('scrolled', window.scrollY > 24); qs('#scrollProgress').style.width = `${(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`; qs('.back-to-top').classList.toggle('visible', window.scrollY > 500); }, { passive: true }); }
function toggleTheme() { const light = document.body.classList.toggle('light-theme'); localStorage.setItem('portfolio-theme', light ? 'light' : 'dark'); qs('#themeToggle i').className = `fa-solid fa-${light ? 'sun' : 'moon'}`; }
function setupForm() { qs('#contactForm').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; let valid = true; qsa('input, textarea', form).forEach(field => { const error = qs('.error-message', field.parentElement); let message = ''; if (!field.value.trim()) message = 'Bagian ini wajib diisi.'; else if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value)) message = 'Gunakan format email yang valid.'; error.textContent = message; field.classList.toggle('invalid', Boolean(message)); if (message) valid = false; }); if (valid) { qs('#formStatus').textContent = 'Terima kasih. Pesanmu sudah siap dikirim.'; form.reset(); } }); }

qsa('[data-close-modal]').forEach(element => element.addEventListener('click', closeProjectModal));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeProjectModal(); });
setupNavigation(); setupReveal(); setupForm(); loadPortfolioData();
