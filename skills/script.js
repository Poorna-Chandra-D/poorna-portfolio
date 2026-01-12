// Load and display all skills
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('../skills.json');
        const skills = await response.json();
        displayAllSkills(skills);
    } catch (error) {
        console.error('Error loading skills:', error);
    }
});

function displayAllSkills(skills) {
    const skillsGrid = document.getElementById('allSkillsGrid');
    
    // Categorize skills
    const categories = {
        frontend: ['React', 'Next', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'TypeScript'],
        backend: ['Java', 'Spring', 'Node', 'Express', 'Python', 'Flask'],
        database: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
        cloud: ['AWS', 'Lambda', 'EC2'],
        language: ['JavaScript', 'Python', 'Java', 'TypeScript'],
        tools: ['Git', 'Postman', 'Docker', 'Jira', 'Figma', 'Confluence', 'n8n']
    };
    
    function getCategory(skillName) {
        for (let [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => skillName.toLowerCase().includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        return 'tools';
    }
    
    let skillHTML = '';
    
    skills.forEach(skill => {
        const category = getCategory(skill.name);
        skillHTML += `
            <div class="skill-card ${category}">
                <div class="skill-icon">
                    <img src="${skill.icon}" alt="${skill.name}" />
                </div>
                <div class="skill-name">${skill.name}</div>
            </div>
        `;
    });
    
    skillsGrid.innerHTML = skillHTML;
}
