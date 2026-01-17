const form = document.getElementById('search-form');
const input = document.getElementById('question-input');
const resultContainer = document.getElementById('result-container');
const loading = document.getElementById('loading');
const answerText = document.getElementById('answer-text');
const sourcesList = document.getElementById('sources-list');
const similarList = document.getElementById('similar-list');
const historyList = document.getElementById('history-list');

// Load history on start
let searchHistory = JSON.parse(localStorage.getItem('turboHistory')) || [];
renderHistory();

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
        performSearch(query);
    }
});

document.getElementById('clear-history').addEventListener('click', () => {
    searchHistory = [];
    localStorage.removeItem('turboHistory');
    renderHistory();
});

async function performSearch(question) {
    // UI Reset
    resultContainer.classList.add('hidden');
    loading.classList.remove('hidden');
    input.value = question;
    
    // Add to history
    addToHistory(question);

    try {
        // Panggil Serverless Function
        const response = await fetch(`/api?question=${encodeURIComponent(question)}`);
        const data = await response.json();

        if (response.ok) {
            displayResults(data);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error(error);
        alert('Gagal mengambil data. Silakan coba lagi.');
    } finally {
        loading.classList.add('hidden');
    }
}

function displayResults(data) {
    // 1. Tampilkan Jawaban
    answerText.textContent = data.answer;

    // 2. Tampilkan Sources
    sourcesList.innerHTML = '';
    if (data.sources && data.sources.length > 0) {
        data.sources.forEach(url => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.textContent = new URL(url).hostname; // Tampilkan domain saja agar rapi
            li.appendChild(a);
            sourcesList.appendChild(li);
        });
    } else {
        sourcesList.innerHTML = '<li>Tidak ada sumber ditemukan.</li>';
    }

    // 3. Tampilkan Similar Questions
    similarList.innerHTML = '';
    if (data.similarQuestions && data.similarQuestions.length > 0) {
        data.similarQuestions.forEach(q => {
            const li = document.createElement('li');
            li.textContent = q.question || q; // Sesuaikan dengan struktur respons
            li.onclick = () => performSearch(li.textContent);
            similarList.appendChild(li);
        });
    } else {
        similarList.innerHTML = '<li>Tidak ada pertanyaan terkait.</li>';
    }

    resultContainer.classList.remove('hidden');
}

function addToHistory(question) {
    // Hapus duplikat dan limit 10 item
    searchHistory = searchHistory.filter(item => item !== question);
    searchHistory.unshift(question);
    if (searchHistory.length > 10) searchHistory.pop();
    
    localStorage.setItem('turboHistory', JSON.stringify(searchHistory));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    searchHistory.forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        li.onclick = () => performSearch(q);
        historyList.appendChild(li);
    });
}
