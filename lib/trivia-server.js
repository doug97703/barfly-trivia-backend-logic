const io = require('socket.io')(3001);
io ? console.log('server socketed') : console.log('server not connected');

const superagent = require('superagent');

const game = io.of('/game');
const memory = {
  player1: true,
  score: {},
  guesses: {},
  readyCount: 0,
  participants: 0,
};

game.on('connection', (socket) => {
  console.log('game CHANNEL', socket.id);
  socket.on('join', room => {
    console.log('joined', room);
    socket.join(room);
    game.to(room).emit('message', 'you have joined the game');
    game.to(room).emit('teamName', room);
    if (memory.player1) {
      game.to(room).emit('players?');
      memory.player1 = false;
    }
    memory.readyCount += 1;
    memory.score[room] = 0;
    memory.guesses = 0;
    console.log(memory);
    memory.participants === memory.readyCount ? initiate() : waiting();
  });

  socket.on('setup', players => memory.participants = Number.parseInt(players) );

  socket.on('guess', payload => {
    console.log(payload);
    let team = payload.team;
    if(payload.guess) {
      memory.score[team] += 1;
      memory.guesses += 1;
      game.to(team).emit('message', 'your guess was correct!');
      game.to(team).emit('message', '----------------------');
    }
    else {
      memory.guesses += 1;
      game.to(team).emit('message', 'your guess was incorrect :(');
      game.to(team).emit('message', '----------------------');
    }
    memory.guesses % memory.participants === 0 ?  endTurn(memory.score) : game.to(team).emit('message', 'awaiting the other team(s)....');
  });

});

function waiting() {
  game.emit('message', 'waiting for more teams....');
}

async function initiate() {
  let questions = await getQuestions();
  console.log(questions);
  memory.questions = questions;
  game.emit('message', 'game starting in 5 seconds...');
  return setTimeout(poseQuestion, 5000);
}

async function getQuestions() {
  const category = Math.floor(Math.random() * 24 + 9);
  const url = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=medium&type=multiple`;
  return superagent.get(url)
    .then( result => {
      return Promise.resolve(JSON.parse(result.text).results);
    });
}

function poseQuestion() {
  if(memory.questions.length === 0) { return endTheGame(memory.score); }
  let current = memory.questions.shift();
  game.emit('question', current);
}

function endTurn(score) {
  console.log(score);
  game.emit('message', 'CURRENT SCORE: ');
  game.emit('message', score);
  game.emit('message', '----------------------');
  return setTimeout(poseQuestion, 2000);
}

function endTheGame(score) {
  game.emit('end', score);
  io.close();
}



