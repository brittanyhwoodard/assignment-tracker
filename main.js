let assignments = [];
let editingId = null;

window.onload = function() {
     assignments = getAssignments();
     renderAssignments(assignments);
};

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
};

function updateAssignment(id) {
    const assignment = assignments.find(a => a.id === id);

    document.getElementById('assignment-title').value = assignment.title;
    document.getElementById('assignment-course').value = assignment.course;
    document.getElementById('assignment-type').value = assignment.type;
    document.getElementById('assignment-due-date').value = assignment.dueDate;
    document.getElementById('assignment-status').value = assignment.status;

    editingId = id;
    document.getElementById('assignment-submit').textContent = 'Edit Assignment';
};

function deleteAllAssignments() {
    assignments = [];
    saveAssignments(assignments);
    renderAssignments(assignments);
};

function renderAssignments(assignments) {
    const assignmentList = document.getElementById('assignments-list');
    assignmentList.innerHTML = '';
    assignments.forEach(assignment => {
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-card';
        assignmentItem.dataset.assignmentId = assignment.id;
        assignmentItem.innerHTML = `<p>${assignment.title} - ${assignment.course} - ${assignment.type} - Due: ${new Date(assignment.dueDate).toLocaleDateString()} - Status: ${assignment.status}</p>
                                    <button class="delete-btn" onclick="deleteAssignment(${assignment.id})">Delete</button><button class="edit-btn" onclick="updateAssignment(${assignment.id})">Edit</button>`;
        assignmentList.appendChild(assignmentItem);
    });
    if (assignments.length === 0) {
        assignmentList.innerHTML = '<p>No assignments yet.</p>';
    };
};

document.getElementById('new-assignment-form').addEventListener('submit', function(event) {
    event.preventDefault();

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
        document.getElementById('assignment-submit').textContent = 'Add Assignment';
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
    event.target.reset();
});
