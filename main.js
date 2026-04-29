let assignments = [];
let courses = [];
let editingId = null;
const viewSettingInputs = document.querySelectorAll('.viewSetting-selection input');
const defaultSettings = {
    showOverdue: true,
    showToday: true,
    showWeek: true,
    showLater: true,
    showCompleted: false
};
let viewSettings = JSON.parse(localStorage.getItem('viewSettings')) || defaultSettings;

window.onload = function() {
    assignments = getAssignments();
    renderAssignmentsView();
    initViewSettings();
};

// --- DOM Selectors and Event Listeners ---
document.getElementById('new-assignment-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    const title = document.getElementById('assignment-title').value;
    const course = document.getElementById('assignment-course').value;
    const type = document.getElementById('assignment-type').value;
    const dueDate = document.getElementById('assignment-due-date').value;
    const status = document.getElementById('assignment-status').value;
    const color = document.querySelector('input[name="assignment-color"]:checked').value;

    if (editingId) {
        assignments = assignments.map(a =>
            a.id === editingId
                ? { id: editingId, title, course, type, dueDate, status, color }
                : a
        );
        editingId = null;
        resetForm();
    } else {
        assignments.push({
            id: Date.now(),
            title,
            course,
            type,
            dueDate,
            status,
            color
        });
    }

    saveAssignments(assignments);
    renderAssignmentsView()
    event.target.reset();
    assignmentContainer.style.display = 'none';
});

document.getElementById('close-form').addEventListener('click', function() {
    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    assignmentContainer.style.display = 'none';
    const assignmentForm = document.getElementById('new-assignment-form');
    assignmentForm.reset();
    editingId = null;
    resetForm();
});

/* Adding event listeners to each label */
viewSettingInputs.forEach(input => {
    input.addEventListener('change', function() {
        const settingName = this.value;

        if (viewSettings.hasOwnProperty(settingName)) {
            viewSettings[settingName] = this.checked;

            saveViewSettings();
        }

        renderAssignmentsView();
    });
});

document.getElementById('close-settings').addEventListener('click', function() {
    const settingsOverlay = document.getElementById('settings-overlay');
    settingsOverlay.style.display = 'none';
});

document.getElementById('add-assignment-btn').addEventListener('click', function() {
    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    assignmentContainer.style.display = 'flex';
});

document.getElementById('settings-btn').addEventListener('click', function() {
    const settingsOverlay = document.getElementById('settings-overlay');
    settingsOverlay.style.display = 'flex';
});

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('overlay')) {
        event.target.style.display = 'none';
        resetForm();
    };
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        var overlays = document.querySelectorAll('.overlay');
        overlays.forEach(function(overlay) {
            overlay.style.display = 'none';
            resetForm();
        });
    };
});

// --- CRUD Functions ---
function saveAssignments(assignments) {
    localStorage.setItem('assignments', JSON.stringify(assignments));
};

function saveViewSettings() {
    localStorage.setItem('viewSettings', JSON.stringify(viewSettings)) || defaultSettings;
}

function deleteAssignment(id) {
    assignments = assignments.filter(assignment => assignment.id !== id);
    saveAssignments(assignments);
    renderAssignmentsView();
};

function updateAssignment(id) {
    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    assignmentContainer.style.display = 'flex';
    const assignment = assignments.find(a => a.id === id);

    document.getElementById('assignment-title').value = assignment.title;
    document.getElementById('assignment-course').value = assignment.course;
    document.getElementById('assignment-type').value = assignment.type;
    document.getElementById('assignment-due-date').value = assignment.dueDate;
    document.getElementById('assignment-status').value = assignment.status;
    document.querySelector(`input[name="assignment-color"][value="${assignment.color}"]`).checked = true;

    editingId = id;
    document.getElementById('assignment-submit').textContent = 'Save Changes';
    document.getElementById('form-title').textContent = 'Edit Assignment';
};

function deleteAllAssignments() {
    assignments = [];
    saveAssignments(assignments);
    renderAssignmentsView()
};

function categorizeAssignments(assignments) {

    const today = new Date();
    today.setHours(0,0,0,0);

    const week = new Date(today);
    week.setDate(today.getDate() + 7);

    const sorted = [...assignments].sort(
        (a,b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    const overdue = [];
    const dueToday = [];
    const dueThisWeek = [];
    const later = [];
    const completed = [];

    sorted.forEach(a => {

        if (a.status === 'completed') {
            completed.push(a);
            return;
        }

        const due = new Date(a.dueDate);
        due.setHours(0,0,0,0);

        if (due < today) {
            overdue.push(a);
        } 
        else if (due.getTime() === today.getTime()) {
            dueToday.push(a);
        } 
        else if (due <= week) {
            dueThisWeek.push(a);
        } 
        else {
            later.push(a);
        }

    });

    return {
        overdue,
        dueToday,
        dueThisWeek,
        later,
        completed
    };
};

// --- Helper Functions ---
function renderAssignmentsView() {

    const container = document.getElementById('assignments-list');
    const noAssignmentsMessage = document.getElementById('no-assignments');
    const overviewContainer = document.getElementById('assignments-sidebar');

    container.innerHTML = '';

    if (assignments.length === 0) {
        noAssignmentsMessage.style.display = 'flex';
        overviewContainer.style.display = 'none';
        return;
    };

    noAssignmentsMessage.style.display = 'none';
    overviewContainer.style.display = 'flex';

    const categorized = categorizeAssignments(assignments);

    if (viewSettings.showOverdue)
        renderSection("Overdue", categorized.overdue);

    if (viewSettings.showToday)
        renderSection("Due Today", categorized.dueToday);

    if (viewSettings.showWeek)
        renderSection("Due This Week", categorized.dueThisWeek);

    if (viewSettings.showLater)
        renderSection("Later", categorized.later);

    if (viewSettings.showCompleted)
        renderSection("Completed", categorized.completed);

    updateTotalCount();
    findAndPopulateCourses();
    renderBarChart();
};

function renderAssignmentsInto(assignments, container) {

    assignments.forEach(assignment => {

        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-item';
        assignmentItem.dataset.assignmentId = assignment.id;
        assignmentItem.innerHTML =      `
            <span class="item-left">
                <div class="view-color" style="background-color: var(--${assignment.color});"></div>
                <p class="view-title">${assignment.title}</p>
                <p class="view-course">${assignment.course}</p>
                <p class="view-due-date">${new Date(assignment.dueDate.replace(/-/g, '/')).toLocaleDateString()}</p>
                <p class="view-status">${assignment.status}</p>
            </span>
            <span class="item-right">
                <span class="view-type">${assignment.type}</span>
                <span class="item-buttons">
                <button class="circle-btn edit-btn" onclick="updateAssignment(${assignment.id})">
                <img src="images/edit-btn.png" alt="Edit Icon" class="edit-btn" width="16">
                </button>
                <button class="circle-btn delete-btn" onclick="deleteAssignment(${assignment.id})">
                <img src="images/delete-btn.png" alt="Delete Icon" class="delete-btn" width="16">
                </button>
                </span>
            </span>`;
        container.appendChild(assignmentItem);

    });

};

function renderSection(title, list) {

    if (list.length === 0) return;

    const container = document.getElementById('assignments-list');
    const section = document.createElement('div');
    section.className = "assignment-section";
    const header = document.createElement('h2');
    header.className = "assignment-section-header";
    header.textContent = title;
    const listDiv = document.createElement('div');
    listDiv.className = "assignment-section-list";

    section.appendChild(header);
    section.appendChild(listDiv);

    renderAssignmentsInto(list, listDiv);

    container.appendChild(section);

};

function getAssignments() {
    const storedAssignments = localStorage.getItem('assignments');
    if (storedAssignments) {
        return JSON.parse(storedAssignments);
    }
    return [];
};

function updateTotalCount() {
    const upcomingCount = document.getElementById('upcoming-assignments');
    upcomingCount.textContent = `${assignments.length} Total Assignment${assignments.length !== 1 ? 's' : ''}`;
};

function resetForm() {
    const assignmentForm = document.getElementById('new-assignment-form');
    assignmentForm.reset();
    editingId = null;
    document.getElementById('assignment-submit').textContent = 'Add';
    document.getElementById('form-title').textContent = 'Add Assignment';
};

function initViewSettings() {
    const categorized = categorizeAssignments(assignments);
    const categoryData = {
        showOverdue: categorized.overdue,
        showToday: categorized.dueToday,
        showWeek: categorized.dueThisWeek,
        showLater: categorized.later,
        showCompleted: categorized.completed
    };

    viewSettingInputs.forEach(input => {
        const settingName = input.value;

        if (viewSettings.hasOwnProperty(settingName)) {
            input.checked = viewSettings[settingName];

            const hasAssignments = categoryData[settingName] && categoryData[settingName].length > 0;
            input.disabled = !hasAssignments;

            input.parentElement.style.opacity = hasAssignments ? "1" : "0.5";
            input.parentElement.style.cursor = hasAssignments ? "pointer" : "not-allowed";
        }
    });

    renderAssignmentsView();
};

function findAndPopulateCourses() {
    const coursesContainer = document.getElementById('courses-container');
    coursesContainer.innerHTML = '';

    courses = [...new Set(assignments.map(a => a.course))];

    courses.forEach(course => {
        const courseItem = document.createElement('span');
        courseItem.className = 'course-item';
        courseItem.innerHTML = `<p>${course}</p>`;
        coursesContainer.appendChild(courseItem);
    });

    document.getElementById('numCourses').innerHTML = `You have ${courses.length} courses:`;
};

function renderBarChart() {
    const completed = document.getElementById('numCompleted');
    const inProgress = document.getElementById('numStarted');
    const notStarted = document.getElementById('numNotStarted');
    const categorized = categorizeAssignmentsProgress(assignments);
    
    if (categorized.completed.length > 0) {
        completed.style.width = `${( (categorized.completed.length / assignments.length) * 100)}%`;
        completed.innerHTML = `${categorized.completed.length} Completed`;
    } else {
        completed.style.display = 'none';
    }
    if (categorized.inProgress.length > 0) {
        inProgress.style.width = `${( (categorized.inProgress.length / assignments.length) * 100)}%`;
        inProgress.innerHTML = `${categorized.inProgress.length} In Progress`;
    } else {
        inProgress.style.display = 'none';
    }
    if (categorized.notStarted.length > 0) {
        notStarted.style.width = `${( (categorized.notStarted.length / assignments.length) * 100)}%`;
        notStarted.innerHTML = `${categorized.notStarted.length} Not Started`;
    } else {
        notStarted.style.display = 'none';
    }
    
};

function categorizeAssignmentsProgress(assignments) {
    const notStarted = [];
    const inProgress = [];
    const completed = [];

    assignments.forEach(a => {

        if (a.status === 'completed') {
            completed.push(a);
            return;
        }

        if (a.status === 'in-progress') {
            inProgress.push(a);
            return;
        } 
        if (a.status === 'not-started') {
            notStarted.push(a);
            return;
        }

    });

    return {
        notStarted,
        inProgress,
        completed
    };
};

