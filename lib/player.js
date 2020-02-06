const io = require('socket.io-client');
const prompt = require('prompt');

const game = io.connect('http://localhost:3001/game');
const joinGame = (teamName) => game.emit('join', teamName);
game.on('players?', () => setup());
game.on('message', message => console.log(message));
game.on('question', question => displayQuestion(question));
game.on('end', score => endGame(score));

let teamName;

prompt.start();

prompt.get(['team-name'], function (err, result) {
  if (err) { return onErr(err); }
  console.log(result);
  console.log('  Team Name: ' + result['team-name']);
  teamName = result['team-name'];
  joinGame(teamName);
});

function onErr(err) {
  console.log(err);
  return 1;
}

async function setup() {
  await prompt.start();
  prompt.get(['how many players in this game?'], function (err, result) {
    if (err) { return onErr(err); }
    game.emit('setup', result['how many players in this game?']); //player1 gets to choose # of players
  });
}

function displayQuestion(question) {
  let index = Math.floor(Math.random() * 4);
  let arr = question.incorrect_answers;
  arr.splice(index, 0, question.correct_answer); 
  //putting the answer into the incorrect answer arr at a random index
  console.log('-------QUESTION-------');
  console.log(question.question);
  console.log('----------------------');
  console.log('OPTIONS: ');
  console.log('A: ', arr[0]);
  console.log('B: ', arr[1]);
  console.log('C: ', arr[2]);
  console.log('D: ', arr[3]);
  getAnswer(correctAnswer(index));
}

async function getAnswer(correct) {
  //getting guess from user
  await prompt.start();
  prompt.get(['your answer?'], function (err, result) {
    if (err) { return onErr(err); }
    result['your answer?'].toUpperCase() === correct ? 
      game.emit('guess', { team: teamName, guess: true }) : 
      game.emit('guess', { team: teamName, guess: false });
  });
}

function correctAnswer(index) {
  //comparing guess to correct answer index to determine correctness
  let answer;
  switch (index) {
  case 0:
    answer = 'A';
    break;
  case 1:
    answer = 'B';
    break;
  case 2:
    answer = 'C';
    break;
  case 3:
    answer = 'D';
    break;
  }
  return answer;
}

function endGame(score) {
  console.log('the game has ended! the final score is: ', score);
  game.close();
}