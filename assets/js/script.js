$(document).ready(function () {

    $('#menu').click(function () {
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        if (window.scrollY > 60) {
            document.querySelector('#scroll-top').classList.add('active');
        } else {
            document.querySelector('#scroll-top').classList.remove('active');
        }

        // scroll spy
        $('section').each(function () {
            let height = $(this).height();
            let offset = $(this).offset().top - 200;
            let top = $(window).scrollTop();
            let id = $(this).attr('id');

            if (top > offset && top < offset + height) {
                $('.navbar ul li a').removeClass('active');
                $('.navbar').find(`[href="#${id}"]`).addClass('active');
            }
        });
    });

    // smooth scrolling
    $('a[href*="#"]').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $($(this).attr('href')).offset().top,
        }, 500, 'linear')
    });

    // <!-- emailjs to mail contact form data -->
    $("#contact-form").submit(function (event) {
        emailjs.init("UogjgXfUmzYkSGhK0");

        emailjs.sendForm('service_nr2lale', 'template_c35rrsi', '#contact-form')
            .then(function (response) {
                console.log('SUCCESS!', response.status, response.text);
                document.getElementById("contact-form").reset();
                alert("Form Submitted Successfully");
            }, function (error) {
                console.log('FAILED...', error);
                alert("Form Submission Failed! Try Again");
            });
        event.preventDefault();
    });
    // <!-- emailjs to mail contact form data -->

});

document.addEventListener('visibilitychange',
    function () {
        if (document.visibilityState === "visible") {
            document.title = "Portfolio | Poorna Chandra Dinesh";
            $("#favicon").attr("href", "assets/images/favicon.png");
        }
        else {
            document.title = "Come Back To Portfolio";
            $("#favicon").attr("href", "assets/images/favhand.png");
        }
    });


// <!-- typed js effect starts -->
var typed = new Typed(".typing-text", {
    strings: ["Software Engineer", "Data Engineer", "Network Engineer", "Application Developer", "Network Software Engineer", "Site Reliability Engineer"],
    loop: true,
    typeSpeed: 50,
    backSpeed: 25,
    backDelay: 500,
});
// <!-- typed js effect ends -->

async function fetchData(type = "skills") {
    let response
    type === "skills" ?
        response = await fetch("skills.json")
        :
        response = await fetch(type === "projects" ? "./projects/projects.json" : "./certifications/certifications.json")
    const data = await response.json();
    return data;
}

function showSkills(skills) {
    let skillsContainer1 = document.getElementById("skillsContainer1");
    let skillsContainer2 = document.getElementById("skillsContainer2");
    
    // Categorize skills
    const categories = {
        frontend: ['React', 'Next', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'TypeScript'],
        backend: ['Java', 'Spring', 'Node', 'Express', 'Python', 'Flask'],
        database: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
        cloud: ['AWS', 'Lambda', 'EC2'],
        language: ['JavaScript', 'Python', 'Java', 'TypeScript'],
        tools: ['Git', 'Postman', 'Docker', 'Jira', 'Figma']
    };
    
    function getCategory(skillName) {
        for (let [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => skillName.toLowerCase().includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        return 'tools';
    }
    
    // Split skills into two rows
    let row1Skills = "";
    let row2Skills = "";
    
    skills.forEach((skill, index) => {
        const category = getCategory(skill.name);
        const badgeHTML = `
        <div class="skill-badge ${category}">
            <img src="${skill.icon}" alt="${skill.name}" />
            <span>${skill.name}</span>
        </div>`;
        
        // Alternate between rows
        if (index % 2 === 0) {
            row1Skills += badgeHTML;
        } else {
            row2Skills += badgeHTML;
        }
    });
    
    // Duplicate skills for infinite scroll effect
    skillsContainer1.innerHTML = row1Skills + row1Skills;
    skillsContainer2.innerHTML = row2Skills + row2Skills;
}




let homeProjectsData = [];
let projectPage = 1;
const projectPageSize = 3;

function buildProjectsPagination(totalPages) {
    const pagination = document.querySelector("#projectsPagination");
    if (!pagination) return;

    const prevDisabled = projectPage === 1 ? "disabled" : "";
    const nextDisabled = projectPage === totalPages ? "disabled" : "";

    let pagesHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const active = i === projectPage ? "active" : "";
        pagesHTML += `<button class="page-btn ${active}" data-page="${i}">${i}</button>`;
    }

    pagination.innerHTML = `
      <button class="nav-btn" data-dir="prev" ${prevDisabled}><i class="fas fa-chevron-left"></i> Previous</button>
      ${pagesHTML}
      <button class="nav-btn" data-dir="next" ${nextDisabled}>Next <i class="fas fa-chevron-right"></i></button>
    `;

    pagination.onclick = (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const dir = target.getAttribute('data-dir');
        const page = Number(target.getAttribute('data-page'));
        const filtered = homeProjectsData.filter(project => project.category !== "android");
        const totalPagesUpdated = Math.max(1, Math.ceil(filtered.length / projectPageSize));
        if (dir === 'prev' && projectPage > 1) {
            projectPage -= 1;
            renderHomeProjects();
        } else if (dir === 'next' && projectPage < totalPagesUpdated) {
            projectPage += 1;
            renderHomeProjects();
        } else if (page) {
            projectPage = page;
            renderHomeProjects();
        }
    };
}

function renderHomeProjects() {
    const projectsContainer = document.querySelector("#homeProjects");
    if (!projectsContainer) return;

    const meta = document.querySelector("#projectsCount");
    const filtered = homeProjectsData.filter(project => project.category !== "android");
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / projectPageSize));
    projectPage = Math.min(projectPage, totalPages);

    const start = (projectPage - 1) * projectPageSize;
    const visible = filtered.slice(start, start + projectPageSize);

    if (meta) {
        const startDisplay = total === 0 ? 0 : start + 1;
        const endDisplay = Math.min(total, start + visible.length);
        meta.textContent = `Showing ${startDisplay}-${endDisplay} of ${total} projects`;
    }

    const projectHTML = visible.map(project => {
        const features = (project.features && project.features.length ? project.features : [project.desc]).map(feature => `<li>${feature}</li>`).join('');
        const techBadges = (project.tech || []).map(tech => `<span class="tech-badge">${tech}</span>`).join('');

        return `
        <div class="project-card">
            <div class="project-image">
                <img src="/assets/images/projects/${project.image}.png" alt="${project.name}" />
                <div class="project-zoom">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.name}</h3>
                <ul class="project-features">
                    ${features}
                </ul>
                <div class="project-tech">
                    ${techBadges}
                </div>
                <div class="project-links">
                    <a href="${project.links.view}" target="_blank" title="View Project">
                        <i class="fas fa-external-link-alt"></i> View
                    </a>
                    <a href="${project.links.code}" target="_blank" title="View Code">
                        <i class="fas fa-code"></i> Code
                    </a>
                </div>
            </div>
        </div>`;
    }).join('');

    projectsContainer.innerHTML = projectHTML;
    buildProjectsPagination(totalPages);
    attachProjectPointerEffects();
    attachProjectHoverTooltip();
    attachProjectClickZoom();
}

function attachProjectPointerEffects() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--px', `${x}px`);
            card.style.setProperty('--py', `${y}px`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.removeProperty('--px');
            card.style.removeProperty('--py');
        });
    });
}

function getOrCreateCursorTooltip() {
    let tooltip = document.querySelector('.cursor-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'cursor-tooltip';
        tooltip.innerHTML = '<span class="avatar"></span><span class="label"></span>';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function attachProjectHoverTooltip() {
    const tooltip = getOrCreateCursorTooltip();
    const cards = document.querySelectorAll('.project-card');
    const show = () => { tooltip.style.display = 'inline-flex'; };
    const hide = () => { tooltip.style.display = 'none'; };
    const setContent = (card) => {
        const titleEl = card.querySelector('.project-title');
        const name = titleEl ? titleEl.textContent.trim() : 'Project';
        const short = name.length > 22 ? name.slice(0, 22).trim() + '…' : name;
        const avatar = name.charAt(0).toUpperCase();
        tooltip.querySelector('.avatar').textContent = avatar;
        tooltip.querySelector('.label').textContent = short;
    };
    const move = (e) => {
        const offsetX = 16;
        const offsetY = 20;
        let x = e.clientX + offsetX;
        let y = e.clientY + offsetY;
        const rect = tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (x + rect.width > vw - 8) x = vw - rect.width - 8;
        if (y + rect.height > vh - 8) y = vh - rect.height - 8;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    };
    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            setContent(card);
            show();
        });
        card.addEventListener('mousemove', move);
        card.addEventListener('mouseleave', hide);
    });
}

function attachProjectClickZoom() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const add = () => card.classList.add('is-clicked');
        const remove = () => card.classList.remove('is-clicked');
        card.addEventListener('mousedown', add);
        card.addEventListener('mouseup', () => {
            setTimeout(remove, 120);
        });
        card.addEventListener('mouseleave', remove);
        card.addEventListener('touchstart', add, { passive: true });
        card.addEventListener('touchend', () => {
            setTimeout(remove, 160);
        }, { passive: true });
    });
}

function addProjectSwipe() {
    const container = document.querySelector('#homeProjects');
    if (!container) return;
    let startX = 0;
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    container.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = endX - startX;
        const threshold = 50;
        const filtered = homeProjectsData.filter(project => project.category !== "android");
        const totalPages = Math.max(1, Math.ceil(filtered.length / projectPageSize));
        if (diff < -threshold && projectPage < totalPages) {
            projectPage += 1;
            renderHomeProjects();
        } else if (diff > threshold && projectPage > 1) {
            projectPage -= 1;
            renderHomeProjects();
        }
    });
}

function showProjects(projects) {
    homeProjectsData = projects;
    renderHomeProjects();
    addProjectSwipe();
}

function showCertifications(certs) {
        let certsContainer = document.querySelector("#certifications .box-container");
        let certHTML = "";
        certs.slice(0, 10).forEach(cert => {
                certHTML += `
                <div class="box tilt">
            <img draggable="false" src="/assets/images/certifications/${cert.image}.png" alt="certification" />
            <div class="content">
                <div class="tag">
                <h3>${cert.name}</h3>
                </div>
                <div class="desc">
                      <p><strong>Issuer:</strong> ${cert.issuer}</p>
                      <p><strong>Issued:</strong> ${cert.issued}${cert.expires ? ` · <strong>Expires:</strong> ${cert.expires}` : ''}</p>
                      ${cert.credentialId ? `<p class="credential-id"><strong>Credential ID:</strong> ${cert.credentialId}</p>` : ''}
                    <p>${cert.desc}</p>
                    <div class="btns">
                        <a href="${cert.links.credential}" class="btn" target="_blank"><i class="fas fa-link"></i> Show credential</a>
                    </div>
                </div>
            </div>
        </div>`
        });
        certsContainer.innerHTML = certHTML;

        VanillaTilt.init(document.querySelectorAll("#certifications .tilt"), {
                max: 15,
        });

        const srtop = ScrollReveal({
                origin: 'top',
                distance: '80px',
                duration: 1000,
                reset: true
        });
        srtop.reveal('#certifications .box', { interval: 200 });
}

fetchData().then(data => {
    showSkills(data);
});

fetchData("projects").then(data => {
    showProjects(data);
});

fetchData("certifications").then(data => {
    showCertifications(data);
});

// <!-- tilt js effect starts -->
VanillaTilt.init(document.querySelectorAll(".tilt"), {
    max: 15,
});
// <!-- tilt js effect ends -->


// pre loader start
// function loader() {
//     document.querySelector('.loader-container').classList.add('fade-out');
// }
// function fadeOut() {
//     setInterval(loader, 500);
// }
// window.onload = fadeOut;
// pre loader end

// disable developer mode
document.onkeydown = function (e) {
    if (e.keyCode == 123) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
        return false;
    }
}

// Start of Tawk.to Live Chat
var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
(function () {
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/693e38220e66a3197e183ee0/1jcdgmhtc';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
})();
// End of Tawk.to Live Chat


/* ===== SCROLL REVEAL ANIMATION ===== */
const srtop = ScrollReveal({
    origin: 'top',
    distance: '80px',
    duration: 1000,
    reset: true
});

/* SCROLL HOME */
srtop.reveal('.home .content h3', { delay: 200 });
srtop.reveal('.home .content p', { delay: 200 });
srtop.reveal('.home .content .btn', { delay: 200 });

srtop.reveal('.home .image', { delay: 400 });
srtop.reveal('.home .linkedin', { interval: 600 });
srtop.reveal('.home .github', { interval: 800 });
srtop.reveal('.home .twitter', { interval: 1000 });
srtop.reveal('.home .telegram', { interval: 600 });
srtop.reveal('.home .instagram', { interval: 600 });
srtop.reveal('.home .dev', { interval: 600 });

/* SCROLL ABOUT */
srtop.reveal('.about .content h3', { delay: 200 });
srtop.reveal('.about .content .tag', { delay: 200 });
srtop.reveal('.about .content p', { delay: 200 });
srtop.reveal('.about .content .box-container', { delay: 200 });
srtop.reveal('.about .content .resumebtn', { delay: 200 });


/* SCROLL SKILLS */
srtop.reveal('.skills .container', { interval: 200 });
srtop.reveal('.skills .container .bar', { delay: 400 });

/* SCROLL EDUCATION */
srtop.reveal('.education .box', { interval: 200 });

/* SCROLL PROJECTS */
srtop.reveal('.work .box', { interval: 200 });

/* SCROLL CERTIFICATIONS */
srtop.reveal('#certifications .box', { interval: 200 });

/* SCROLL EXPERIENCE */
srtop.reveal('.experience .timeline', { delay: 400 });
srtop.reveal('.experience .timeline .container', { interval: 400 });

/* SCROLL RECOMMENDATIONS */
srtop.reveal('.recommendations .recommendation-box', { interval: 200 });

/* SCROLL CONTACT */
srtop.reveal('.contact .container', { delay: 400 });
srtop.reveal('.contact .container .form-group', { delay: 400 });