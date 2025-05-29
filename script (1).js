// ✅ USER AUTH & ADMIN SETUP
const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
const isAdmin = loggedInUser?.isAdmin || false;

const app = document.getElementById('app');
let defaultFields = {
  "Web Development": [
    { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperloop Text Module Language", "None"], answer: "HyperText Markup Language" },
    { question: "Which tag is used for inserting an image?", options: ["<img>", "<image>", "<src>", "<pic>"], answer: "<img>" },
    { question: "CSS stands for?", options: ["Cascading Style Sheets", "Creative Style System", "Computer Style Sheet", "None"], answer: "Cascading Style Sheets" },
    { question: "Which is a JavaScript framework?", options: ["React", "Laravel", "Django", "Bootstrap"], answer: "React" },
    { question: "What does DOM stand for?", options: ["Document Object Model", "Data Object Method", "Document Order Model", "None"], answer: "Document Object Model" }
  ],
  "Politics": [
    { question: "Who is known as the Father of the Indian Constitution?", options: ["B. R. Ambedkar", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"], answer: "B. R. Ambedkar" },
    { question: "Which is the highest law-making body in India?", options: ["Supreme Court", "Lok Sabha", "Parliament", "President"], answer: "Parliament" },
    { question: "How many members are nominated to the Rajya Sabha by the President?", options: ["2", "10", "12", "15"], answer: "12" },
    { question: "Who is the head of the state in India?", options: ["Prime Minister", "Governor", "President", "Chief Minister"], answer: "President" },
    { question: "Which country has the oldest written constitution?", options: ["India", "USA", "UK", "France"], answer: "USA" }
  ],
  "Education": [
    { question: "What does GPA stand for?", options: ["Grade Percentage Average", "Grade Point Average", "General Performance Average", "Global Point Average"], answer: "Grade Point Average" },
    { question: "Which education system uses the term 'K-12'?", options: ["Indian", "American", "British", "Canadian"], answer: "American" },
    { question: "What is the full form of CBSE?", options: ["Central Board of Secondary Education", "Common Board of School Education", "Central Basic School Education", "Council of Board of School Education"], answer: "Central Board of Secondary Education" },
    { question: "Which university is located in Cambridge, Massachusetts?", options: ["Harvard", "Oxford", "Yale", "Stanford"], answer: "Harvard" },
    { question: "Which Indian exam is for engineering admissions?", options: ["NEET", "UPSC", "JEE", "CAT"], answer: "JEE" }
  ],
  "Sports": [
    { question: "Which country won the FIFA World Cup 2022?", options: ["France", "Brazil", "Argentina", "Germany"], answer: "Argentina" },
    { question: "How many players are on a basketball team on the court?", options: ["5", "6", "7", "11"], answer: "5" },
    { question: "Which sport is Serena Williams associated with?", options: ["Badminton", "Tennis", "Golf", "Squash"], answer: "Tennis" },
    { question: "In cricket, how many balls are there in an over?", options: ["5", "6", "7", "8"], answer: "6" },
    { question: "Who has the most Olympic gold medals?", options: ["Usain Bolt", "Michael Phelps", "Carl Lewis", "Mark Spitz"], answer: "Michael Phelps" }
  ]
};
let fields = JSON.parse(localStorage.getItem('quizFields')) || defaultFields;

function saveFieldsToLocalStorage() {
  localStorage.setItem('quizFields', JSON.stringify(fields));
}

function logout() {
  sessionStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
}

function renderFieldSelection() {
  app.innerHTML = `
    
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Choose Your Field</h1>
      <select id="fieldSelect" class="w-1/2 p-2 border rounded mb-4">
        <option disabled selected>-- Select Field --</option>
        ${Object.keys(fields).map(field => `<option value="${field}">${field}</option>`).join('')}
      </select><br>
      <button onclick="startQuiz()" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Start Quiz</button>
    </div>
  `;

  if (isAdmin) {
    app.innerHTML += `
      <div class="mt-6 text-center">
        <h2 class="text-xl font-semibold mb-2">Admin Panel</h2>
        <button onclick="renderQuizEditor()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Manage Quiz</button>
      </div>
    `;
  }
}

renderFieldSelection();

function renderAddQuizForm() {
  if (!isAdmin) return;

  app.innerHTML = `
    <div class="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Add New Quiz Question</h2>
      <form onsubmit="event.preventDefault(); addQuestionFromForm();" class="space-y-4">
        <input type="text" id="newCategory" placeholder="Category (e.g. Web Development)" class="w-full p-2 border rounded" required />
        <input type="text" id="newQuestion" placeholder="Question" class="w-full p-2 border rounded" required />
        <input type="text" id="newOptionA" placeholder="Option A" class="w-full p-2 border rounded" required />
        <input type="text" id="newOptionB" placeholder="Option B" class="w-full p-2 border rounded" required />
        <input type="text" id="newOptionC" placeholder="Option C" class="w-full p-2 border rounded" required />
        <input type="text" id="newAnswer" placeholder="Correct Answer (Must match one option)" class="w-full p-2 border rounded" required />
        <div class="flex justify-between">
          <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Add Question</button>
          <button type="button" onclick="renderFieldSelection()" class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Back</button>
        </div>
      </form>
    </div>
  `;
}

function addQuestionFromForm() {
  const category = document.getElementById('newCategory').value.trim();
  const question = document.getElementById('newQuestion').value.trim();
  const optionA = document.getElementById('newOptionA').value.trim();
  const optionB = document.getElementById('newOptionB').value.trim();
  const optionC = document.getElementById('newOptionC').value.trim();
  const answer = document.getElementById('newAnswer').value.trim();

  const newQ = {
    question,
    options: [optionA, optionB, optionC],
    answer
  };

  if (!fields[category]) fields[category] = [];
  fields[category].push(newQ);
  saveFieldsToLocalStorage();
  alert("Question added successfully.");
  renderFieldSelection();
}

function deleteQuestion(category, index) {
  if (!isAdmin) return;
  if (confirm("Are you sure you want to delete this question?")) {
    fields[category].splice(index, 1);
    saveFieldsToLocalStorage();
    renderQuizEditor();
  }
}

function renderQuizEditor() {
  app.innerHTML = `
    <div class="max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <h2 class="text-2xl font-bold mb-4">Quiz Editor</h2>
      <div class="mb-4">
        ${Object.keys(fields).map(category => `
          <h3 class="text-xl font-semibold mt-4 mb-2">${category}</h3>
          <ul class="mb-4 space-y-2">
            ${fields[category].map((q, idx) => `
              <li class="p-3 border rounded bg-gray-50">
                <strong>Q:</strong> ${q.question}<br>
                <strong>Options:</strong> ${q.options.join(', ')}<br>
                <strong>Answer:</strong> ${q.answer}
                <div class="text-right mt-2">
                  <button onclick="deleteQuestion('${category}', ${idx})" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                </div>
              </li>
            `).join('')}
          </ul>
        `).join('')}
      </div>
      <div class="text-center mt-6">
        <button onclick="renderAddQuizForm()" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Add New Question</button>
        <button onclick="renderFieldSelection()" class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 ml-4">Back</button>
      </div>
    </div>
  `;
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let timerInterval = null;
let userAnswers = [];

function startQuiz() {
  const selectedField = document.getElementById('fieldSelect').value;
  if (!selectedField) return;
  currentQuestions = shuffleArray([...fields[selectedField]]);
  currentIndex = 0;
  score = 0;
  userAnswers = [];
  startTimer(60);
  renderQuestion();
}

function startTimer(seconds) {
  let timeLeft = seconds;
  const updateTimer = () => {
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = timeLeft;
  };
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showResult();
    }
  }, 1000);
}

function renderQuestion() {
  const q = currentQuestions[currentIndex];
  q.options = shuffleArray(q.options);
  app.innerHTML = `
    <div class="mb-4 text-right text-sm text-gray-600">Time Left: <span id="timer" class="font-bold text-red-500">60</span> seconds</div>
    <h2 class="text-lg font-semibold mb-4">Question ${currentIndex + 1} of ${currentQuestions.length}:</h2>
    <p class="mb-4 text-base font-medium">${q.question}</p>
    <div class="space-y-2">
      ${q.options.map(opt => `
        <button onclick="checkAnswer('${opt}')" class="block w-full text-left p-2 bg-gray-100 rounded hover:bg-blue-100">${opt}</button>
      `).join('')}
    </div>
  `;
}

function checkAnswer(selected) {
  const q = currentQuestions[currentIndex];
  userAnswers.push({ ...q, user: selected });
  if (selected === q.answer) score++;
  currentIndex++;
  if (currentIndex < currentQuestions.length) renderQuestion();
  else {
    clearInterval(timerInterval);
    showResult();
  }
}

function getRemark(score) {
  if (score === 5) return "Excellent Work! 🌟";
  if (score >= 4) return "Great Job! 👍";
  if (score >= 3) return "Good Effort! 🙂";
  if (score >= 2) return "Needs Improvement.";
  return "Better Luck Next Time!";
}

function showResult() {
  const total = currentQuestions.length;
  const percentage = Math.round((score / total) * 100);
  const strokeColor = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#facc15' : '#ef4444'; // green, yellow, red

  app.innerHTML = `
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold mb-4">Your Score</h2>
      <svg class="mx-auto mb-2" width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#e5e7eb" stroke-width="12" fill="none"/>
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="${strokeColor}"
          stroke-width="12"
          fill="none"
          stroke-dasharray="${339.292}" 
          stroke-dashoffset="${339.292 * (1 - score / total)}"
          stroke-linecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20" fill="${strokeColor}" font-weight="bold">${score}/${total}</text>
      </svg>
      <p class="mt-2 text-lg font-semibold text-gray-700">${getRemark(score)}</p>
    </div>

    <div class="space-y-4 mb-6">
      ${userAnswers.map(ans => `
        <div class="p-4 rounded ${ans.user === ans.answer ? 'bg-green-100' : 'bg-red-100'}">
          <p class="font-semibold">${ans.question}</p>
          <p>Your answer: <strong>${ans.user}</strong></p>
          <p>Correct answer: <strong>${ans.answer}</strong></p>
        </div>
      `).join('')}
    </div>

    <div class="text-center space-x-4">
      <button onclick="startQuiz()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold">Restart Quiz</button>
      <button onclick="renderFieldSelection()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded font-semibold">Back to Home</button>
    </div>
  

  `;
}
