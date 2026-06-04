import { RARE_WORDS } from './words.js';
import confetti from 'canvas-confetti';

class RareWordle {
  constructor() {
    this.maxGuesses = parseInt(localStorage.getItem('maxGuesses')) || 6;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.currentGuessIndex = 0;
    this.currentTileIndex = 0;
    this.guesses = [];
    this.targetWord = '';
    this.targetDefinition = '';
    this.targetSynonyms = [];
    this.gameOver = false;
    this.letterStates = {};

    this.initElements();
    this.setupEventListeners();
    this.applyTheme(this.theme);
    this.startNewGame();
  }

  initElements() {
    this.board = document.getElementById('game-board');
    this.keyboardRow1 = document.getElementById('row-1');
    this.keyboardRow2 = document.getElementById('row-2');
    this.keyboardRow3 = document.getElementById('row-3');
    this.resultModal = document.getElementById('result-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.guessRange = document.getElementById('guess-range');
    this.guessVal = document.getElementById('guess-val');
    this.themeToggle = document.getElementById('theme-toggle');
    this.hintBtn = document.getElementById('hint-btn');
    this.hintText = document.getElementById('hint-text');

    this.guessRange.value = this.maxGuesses;
    this.guessVal.textContent = this.maxGuesses;
    this.themeToggle.checked = this.theme === 'light';
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e.key));

    document.getElementById('settings-btn').onclick = () => this.settingsModal.classList.add('active');
    document.getElementById('close-settings').onclick = () => this.saveSettings();
    document.getElementById('new-game-btn').onclick = () => this.startNewGame();
    document.getElementById('show-definition-btn').onclick = () => {
      document.getElementById('definition-text').classList.toggle('active');
    };

    this.hintBtn.onclick = () => this.showHint();

    this.guessRange.oninput = (e) => {
      this.guessVal.textContent = e.target.value;
    };

    this.themeToggle.onchange = (e) => {
      this.theme = e.target.checked ? 'light' : 'dark';
      this.applyTheme(this.theme);
      localStorage.setItem('theme', this.theme);
    };

    window.onclick = (e) => {
      if (e.target === this.resultModal || e.target === this.settingsModal) {
        e.target.classList.remove('active');
      }
    };
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  saveSettings() {
    this.maxGuesses = parseInt(this.guessRange.value);
    localStorage.setItem('maxGuesses', this.maxGuesses);
    this.settingsModal.classList.remove('active');
    this.startNewGame();
  }

  startNewGame() {
    const randomIndex = Math.floor(Math.random() * RARE_WORDS.length);
    const selected = RARE_WORDS[randomIndex];
    this.targetWord = selected.word.toUpperCase();
    this.targetDefinition = selected.definition;
    this.targetSynonyms = selected.synonyms || [];

    this.currentGuessIndex = 0;
    this.currentTileIndex = 0;
    this.guesses = Array(this.maxGuesses).fill('');
    this.gameOver = false;
    this.letterStates = {};

    this.renderBoard();
    this.renderKeyboard();
    this.hintText.classList.remove('active');
    this.hintText.innerHTML = '';
    this.hintBtn.style.display = 'block';

    this.resultModal.classList.remove('active');
    document.getElementById('definition-text').classList.remove('active');
    document.getElementById('definition-text').textContent = this.targetDefinition;
  }

  showHint() {
    if (this.gameOver || this.targetSynonyms.length === 0) return;

    this.hintText.classList.add('active');
    const filteredSynonyms = this.targetSynonyms.filter(
      s => s.toLowerCase() !== this.targetWord.toLowerCase()
    );

    this.hintText.innerHTML = `<strong>Synonyms:</strong><br>` +
      filteredSynonyms.map(s => `<span class="hint-chip">${s}</span>`).join(' ');
    this.hintBtn.style.display = 'none';
  }

  renderBoard() {
    this.board.innerHTML = '';
    this.board.style.gridTemplateRows = `repeat(${this.maxGuesses}, 1fr)`;

    for (let i = 0; i < this.maxGuesses; i++) {
      const row = document.createElement('div');
      row.className = 'row';
      for (let j = 0; j < this.targetWord.length; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${i}-${j}`;
        row.appendChild(tile);
      }
      this.board.appendChild(row);
    }
  }

  renderKeyboard() {
    const rows = [
      'QWERTYUIOP'.split(''),
      'ASDFGHJKL'.split(''),
      ['ENTER', ...'ZXCVBNM'.split(''), 'DEL']
    ];

    [this.keyboardRow1, this.keyboardRow2, this.keyboardRow3].forEach((rowEl, i) => {
      rowEl.innerHTML = '';
      rows[i].forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key';
        if (key === 'ENTER' || key === 'DEL') btn.classList.add('large');
        btn.textContent = key;

        const state = this.letterStates[key];
        if (state) btn.classList.add(state);

        btn.onclick = () => this.handleKeyDown(key);
        rowEl.appendChild(btn);
      });
    });
  }

  handleKeyDown(key) {
    if (this.gameOver) return;

    key = key.toUpperCase();

    if (key === 'ENTER') {
      this.submitGuess();
    } else if (key === 'BACKSPACE' || key === 'DEL') {
      this.deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
      this.addLetter(key);
    }
  }

  addLetter(letter) {
    if (this.currentTileIndex < this.targetWord.length) {
      this.guesses[this.currentGuessIndex] += letter;
      const tile = document.getElementById(`tile-${this.currentGuessIndex}-${this.currentTileIndex}`);
      tile.textContent = letter;
      tile.classList.add('filled');
      this.currentTileIndex++;
    }
  }

  deleteLetter() {
    if (this.currentTileIndex > 0) {
      this.currentTileIndex--;
      this.guesses[this.currentGuessIndex] = this.guesses[this.currentGuessIndex].slice(0, -1);
      const tile = document.getElementById(`tile-${this.currentGuessIndex}-${this.currentTileIndex}`);
      tile.textContent = '';
      tile.classList.remove('filled');
    }
  }

  submitGuess() {
    const guess = this.guesses[this.currentGuessIndex];
    if (guess.length !== this.targetWord.length) {
      this.shakeRow();
      return;
    }

    this.revealGuess(guess);
  }

  revealGuess(guess) {
    const row = this.currentGuessIndex;
    let correctCount = 0;
    const targetArr = this.targetWord.split('');
    const guessArr = guess.split('');
    const statuses = Array(guess.length).fill('absent');

    // First pass for correct positions
    for (let i = 0; i < guess.length; i++) {
      if (guessArr[i] === targetArr[i]) {
        statuses[i] = 'correct';
        targetArr[i] = null;
        correctCount++;
      }
    }

    // Second pass for present letters
    for (let i = 0; i < guess.length; i++) {
      if (statuses[i] === 'correct') continue;

      const targetIndex = targetArr.indexOf(guessArr[i]);
      if (targetIndex !== -1) {
        statuses[i] = 'present';
        targetArr[targetIndex] = null;
      }
    }

    // Update UI with animations
    statuses.forEach((status, i) => {
      setTimeout(() => {
        const tile = document.getElementById(`tile-${row}-${i}`);
        tile.classList.add(status);
        this.updateKeyboardState(guess[i], status);
      }, i * 150);
    });

    setTimeout(() => {
      if (correctCount === this.targetWord.length) {
        this.endGame(true);
      } else if (this.currentGuessIndex === this.maxGuesses - 1) {
        this.endGame(false);
      } else {
        this.currentGuessIndex++;
        this.currentTileIndex = 0;
      }
    }, guess.length * 150 + 200);
  }

  updateKeyboardState(letter, status) {
    const currentStatus = this.letterStates[letter];
    if (status === 'correct') {
      this.letterStates[letter] = 'correct';
    } else if (status === 'present' && currentStatus !== 'correct') {
      this.letterStates[letter] = 'present';
    } else if (status === 'absent' && !currentStatus) {
      this.letterStates[letter] = 'absent';
    }
    this.renderKeyboard();
  }

  shakeRow() {
    const row = this.board.children[this.currentGuessIndex];
    row.style.animation = 'shake 0.5s ease';
    setTimeout(() => row.style.animation = '', 500);
  }

  endGame(won) {
    this.gameOver = true;
    document.getElementById('result-title').textContent = won ? 'Magnificent!' : 'The Word Was Revealed';
    document.getElementById('reveal-word').textContent = this.targetWord;

    if (won) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#34d399', '#22c55e', '#eab308']
      });
    }

    setTimeout(() => {
      this.resultModal.classList.add('active');
    }, 1000);
  }
}


// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

new RareWordle();
