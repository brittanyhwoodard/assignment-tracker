let assignments = [];
let courses = [];
let editingId = null;
const viewSettingInputs = document.querySelectorAll('.viewSetting-selection input');
const viewToggleInput = document.getElementById('view-toggle');
const defaultSettings = {
    showOverdue: true,
    showToday: true,
    showWeek: true,
    showLater: true,
    showCompleted: false
};
let viewSettings = JSON.parse(localStorage.getItem('viewSettings')) || defaultSettings;
let currentView = localStorage.getItem('selectedView') || 'list';
let displayedCalendarDate = new Date();

window.onload = function() {
    assignments = getAssignments();
    initViewSettings();
    renderAssignmentsView();
    setCurrentView(currentView);
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

viewToggleInput.addEventListener('change', function() {
    setCurrentView(this.checked ? 'calendar' : 'list');
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
    renderCalendarView();
    updateTotalCount();

    if (assignments.length === 0) {
        noAssignmentsMessage.style.display = currentView === 'list' ? 'flex' : 'none';
        overviewContainer.style.display = 'none';
        updateDisplayedView();
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

    findAndPopulateCourses();
    renderBarChart();
    updateDisplayedView();
};

function renderAssignmentsInto(assignments, container) {

    assignments.forEach(assignment => {

        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-item';
        assignmentItem.dataset.assignmentId = assignment.id;
        assignmentItem.innerHTML =      `
            <div class="item-left">
                <div class="view-color" style="background-color: var(--${assignment.color});"></div>
                <p class="view-title">${assignment.title}</p>
                <p class="view-course">${assignment.course}</p>
                <p class="view-due-date">${new Date(assignment.dueDate.replace(/-/g, '/')).toLocaleDateString()}</p>
                <p class="view-status">${assignment.status}</p>
            </div>
            <div class="item-right">
                <span class="view-type">${assignment.type}</span>
                <div class="item-buttons">
                <button class="circle-btn edit-btn" onclick="updateAssignment(${assignment.id})">
                <img src="images/edit-btn.png" alt="Edit Icon" class="edit-btn" width="16">
                </button>
                <button class="circle-btn delete-btn" onclick="deleteAssignment(${assignment.id})">
                <img src="images/delete-btn.png" alt="Delete Icon" class="delete-btn" width="16">
                </button>
                </div>
            </div>`;
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

function setCurrentView(view) {
    currentView = view === 'calendar' ? 'calendar' : 'list';
    viewToggleInput.checked = currentView === 'calendar';
    localStorage.setItem('selectedView', currentView);
    updateDisplayedView();
};

function updateDisplayedView() {
    const assignmentsView = document.getElementById('assignments-view');
    const calendarView = document.getElementById('calendar-view');
    const noAssignmentsMessage = document.getElementById('no-assignments');

    assignmentsView.style.display = currentView === 'list' ? 'flex' : 'none';
    calendarView.style.display = currentView === 'calendar' ? 'flex' : 'none';

    if (currentView === 'calendar') {
        noAssignmentsMessage.style.display = 'none';
    } else {
        noAssignmentsMessage.style.display = assignments.length === 0 ? 'flex' : 'none';
    }
};

function renderCalendarView() {
    const calendarContainer = document.getElementById('calendar-view');
    const today = new Date();
    const year = displayedCalendarDate.getFullYear();
    const month = displayedCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstWeekday = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();
    const assignmentsByDate = groupAssignmentsByDate(assignments);

    calendarContainer.innerHTML = '';

    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';

    const calendarTitle = document.createElement('h2');
    calendarTitle.textContent = firstDayOfMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
    });

    const prevButton = document.createElement('button');
    prevButton.className = 'circle-btn calendar-nav-btn';
    prevButton.type = 'button';
    prevButton.innerHTML = '<img src="images/left-arrow-btn.png" alt="Previous Icon" width="16" id="previous-icon">';
    prevButton.addEventListener('click', function() {
        changeCalendarMonth(-1);
    });

    const nextButton = document.createElement('button');
    nextButton.className = 'circle-btn calendar-nav-btn';
    nextButton.type = 'button';
    nextButton.innerHTML = '<img src="images/right-arrow-btn.png" alt="Next Icon" width="16" id="next-icon">';
    nextButton.addEventListener('click', function() {
        changeCalendarMonth(1);
    });

    calendarHeader.appendChild(calendarTitle);
    calendarHeader.appendChild(prevButton);
    calendarHeader.appendChild(nextButton);
    calendarContainer.appendChild(calendarHeader);

    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(dayName => {
        const weekday = document.createElement('div');
        weekday.className = 'calendar-weekday';
        weekday.textContent = dayName;
        calendarGrid.appendChild(weekday);
    });

    for (let i = 0; i < firstWeekday; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateKey = formatDateKey(year, month, day);
        const dayAssignments = assignmentsByDate[dateKey] || [];
        const calendarDay = document.createElement('div');
        calendarDay.className = 'calendar-day';

        if (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
        ) {
            calendarDay.classList.add('today');
        }

        const dayNumber = document.createElement('span');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        calendarDay.appendChild(dayNumber);

        dayAssignments.forEach(assignment => {
            const assignmentPill = document.createElement('button');
            assignmentPill.className = 'calendar-assignment';
            assignmentPill.type = 'button';
            assignmentPill.textContent = assignment.title;
            assignmentPill.style.borderLeftColor = `var(--${assignment.color})`;
            assignmentPill.addEventListener('click', function() {
                updateAssignment(assignment.id);
            });
            calendarDay.appendChild(assignmentPill);
        });

        calendarGrid.appendChild(calendarDay);
    }

    calendarContainer.appendChild(calendarGrid);
};

function changeCalendarMonth(monthChange) {
    displayedCalendarDate = new Date(
        displayedCalendarDate.getFullYear(),
        displayedCalendarDate.getMonth() + monthChange,
        1
    );

    renderCalendarView();
};

function groupAssignmentsByDate(assignments) {
    return assignments.reduce((groups, assignment) => {
        if (!groups[assignment.dueDate]) {
            groups[assignment.dueDate] = [];
        }

        groups[assignment.dueDate].push(assignment);
        return groups;
    }, {});
};

function formatDateKey(year, month, day) {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
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
        completed.style.display = 'flex';
        completed.style.width = `${( (categorized.completed.length / assignments.length) * 100)}%`;
        completed.innerHTML = `${categorized.completed.length} Completed`;
    } else {
        completed.style.display = 'none';
    }
    if (categorized.inProgress.length > 0) {
        inProgress.style.display = 'flex';
        inProgress.style.width = `${( (categorized.inProgress.length / assignments.length) * 100)}%`;
        inProgress.innerHTML = `${categorized.inProgress.length} In Progress`;
    } else {
        inProgress.style.display = 'none';
    }
    if (categorized.notStarted.length > 0) {
        notStarted.style.display = 'flex';
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

