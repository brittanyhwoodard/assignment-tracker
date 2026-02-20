let assignments = [];

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
    
}

function updateAssignment(id, updatedAssignment) {
    
}

function deleteAllAssignments() {
    assignments = [];
    saveAssignments(assignments);
    renderAssignments(assignments);
}

function renderAssignments(assignments) {
    const assignmentList = document.getElementById('assignments-list');
    assignmentList.innerHTML = '';
    assignments.forEach(assignment => {
        const assignmentItem = document.createElement('div');
        assignmentItem.className = 'assignment-card';
        assignmentItem.textContent = `${assignment.title} - ${assignment.course} - ${assignment.type} - Due: ${assignment.dueDate} - Status: ${assignment.status}`;
        assignmentList.appendChild(assignmentItem);
    });
    if (assignments.length === 0) {
        assignmentList.innerHTML = '<p>No assignments yet.</p>';
    }
};

document.getElementById('new-assignment-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('assignment-title').value;
    const course = document.getElementById('assignment-course').value;
    const type = document.getElementById('assignment-type').value;
    const dueDate = document.getElementById('assignment-due-date').value;
    const status = document.getElementById('assignment-status').value;

    const newAssignment = {
        id: Date.now(),
        title: title,
        course: course,
        type: type,
        dueDate: dueDate,
        status: status
    };

    assignments.push(newAssignment);
    saveAssignments(assignments);
    renderAssignments(assignments);
    event.target.reset();

    const notification = document.getElementById('form-feedback');
    notification.textContent = 'Assignment added successfully!';
    setTimeout(() => {
        notification.textContent = '';
    }, 3000);
});
