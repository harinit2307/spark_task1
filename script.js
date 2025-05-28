const app = document.getElementById('app');

const fields = {
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

function renderFieldSelection() {
  app.innerHTML = `
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Choose Your Field</h1>
      <select id="fieldSelect" class="w-1/2 p-2 border rounded mb-4">
        <option disabled selected>-- Select Field --</option>
        ${Object.keys(fields).map(field => `<option value="${field}">${field}</option>`).join('')}
      </select>
      <br>
      <button onclick="startQuiz()" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Start Quiz</button>
    </div>
  `;
}

renderFieldSelection();

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
  if (currentIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    clearInterval(timerInterval);
    showResult();
  }
}

function showResult() {
  app.innerHTML = `
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold mb-2">Your Results</h2>
      <p class="text-lg mb-4">You scored <strong>${score}</strong> out of ${currentQuestions.length}</p>
    </div>
    <div class="space-y-4 mb-6">
      ${userAnswers.map(ans => {
        const correct = ans.user === ans.answer;
        return `
          <div class="p-4 rounded ${correct ? 'bg-green-100' : 'bg-red-100'}">
            <p class="font-semibold">${ans.question}</p>
            <p>Your answer: <strong>${ans.user}</strong></p>
            <p>Correct answer: <strong>${ans.answer}</strong></p>
          </div>
        `;
      }).join('')}
    </div>
    <div class="text-center">
      <button onclick="renderFieldSelection()" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">Restart Quiz</button>
    </div>
  `;
}
