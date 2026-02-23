let assignments = [];
let editingId = null;

window.onload = function() {
    assignments = getAssignments();
    renderAssignments(assignments);
    updateUpcomingCount();
};

function updateUpcomingCount() {
    const upcomingCount = document.getElementById('upcoming-assignments');
    upcomingCount.textContent = `${assignments.length} Upcoming Assignment${assignments.length !== 1 ? 's' : ''}`;
}

function saveAssignments(assignments) {
    localStorage.setItem('assignments', JSON.stringify(assignments));
};

function getAssignments() {
    const storedAssignments = localStorage.getItem('assignments');
    if (storedAssignments) {
        return JSON.parse(storedAssignments);
    }
    return [];
};

function deleteAssignment(id) {
    assignments = assignments.filter(assignment => assignment.id !== id);
    saveAssignments(assignments);
    renderAssignments(assignments);
    updateUpcomingCount();
};

function deleteAllAssignments() {
    // ADD LATER: Add confirmation dialog before deleting all assignments
};

function resetForm() {
    const assignmentForm = document.getElementById('new-assignment-form');
    assignmentForm.reset();
    editingId = null;
    document.getElementById('assignment-submit').textContent = 'Add';
    document.getElementById('form-title').textContent = 'Add Assignment';
}

function updateAssignment(id) {
    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    assignmentContainer.style.display = 'flex';
    const assignment = assignments.find(a => a.id === id);

    document.getElementById('assignment-title').value = assignment.title;
    document.getElementById('assignment-course').value = assignment.course;
    document.getElementById('assignment-type').value = assignment.type;
    document.getElementById('assignment-due-date').value = assignment.dueDate;
    document.getElementById('assignment-status').value = assignment.status;

    editingId = id;
    document.getElementById('assignment-submit').textContent = 'Save Changes';
    document.getElementById('form-title').textContent = 'Edit Assignment';
};

function deleteAllAssignments() {
    assignments = [];
    saveAssignments(assignments);
    renderAssignments(assignments);
    updateUpcomingCount();
};

function renderAssignments(assignments) {
    const assignmentList = document.getElementById('assignments-list');
    const noAssignmentsMessage = document.getElementById('no-assignments');
    assignmentList.innerHTML = '';
    assignments.forEach(assignment => {
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-item';
        assignmentItem.dataset.assignmentId = assignment.id;
        assignmentItem.innerHTML =      `<span class="item-left">
                                        <p class="view-title">${assignment.title}</p>
                                        <p class="view-course">${assignment.course}</p>
                                        <p class="view-due-date">${new Date(assignment.dueDate).toLocaleDateString()}</p>
                                        <p class="view-status">${assignment.status}</p>
                                        </span>
                                        <span class="item-right">
                                        <span class="view-type">${assignment.type}</span>
                                        <span class="item-buttons">
                                        <button class="circle-btn edit-btn" id="edit-btn">
                                        <img src="images/edit-btn.png" alt="Edit Icon" width="16" onclick="updateAssignment(${assignment.id})">
                                        </button>
                                        <button class="circle-btn delete-btn" id="delete-btn" onclick="deleteAssignment(${assignment.id})">
                                        <img src="images/delete-btn.png" alt="Delete Icon" width="16">
                                        </button>
                                        </span>
                                        </span>`;
        assignmentList.appendChild(assignmentItem);
    });
    if (assignments.length === 0) {
        noAssignmentsMessage.style.display = 'flex';
        document.getElementById('assignment-list-header').style.display = 'none';
    } else {
        noAssignmentsMessage.style.display = 'none';
        document.getElementById('assignment-list-header').style.display = 'block';
    };
};

document.getElementById('new-assignment-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const assignmentContainer = document.getElementById('assignment-add-edit-overlay');
    const title = document.getElementById('assignment-title').value;
    const course = document.getElementById('assignment-course').value;
    const type = document.getElementById('assignment-type').value;
    const dueDate = document.getElementById('assignment-due-date').value;
    const status = document.getElementById('assignment-status').value;

    if (editingId) {
        assignments = assignments.map(a =>
            a.id === editingId
                ? { id: editingId, title, course, type, dueDate, status }
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
            status
        });
    }

    saveAssignments(assignments);
    renderAssignments(assignments);
    updateUpcomingCount();
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

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        var overlays = document.querySelectorAll('.overlay');
        overlays.forEach(function(overlay) {
            overlay.style.display = 'none';
            resetForm();
        });
    };
});
