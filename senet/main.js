  // Initialize the game board
  const gameBoard = document.getElementById('gameBoard');
  const diceRollDisplay = document.getElementById('diceRoll');
  const currentPlayerDisplay = document.getElementById('currentPlayer');
  const autoPlay1 = document.getElementById("autoPlay1");
  const autoPlay2 = document.getElementById("autoPlay2");


  const clickSound = new Audio('click.wav');
  const snapSound = new Audio('snap.wav');
  const swipeSound = new Audio('swipe.wav');

  let squares = [];
  let player1Tokens = [];
  let player2Tokens = [];

  var currentPlayer;

  // Create the game board squares
  for (let i = 1; i <= 30; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.id = `square${i}`;

    if (i === 15) {
        square.classList.add('yellow');
    } else if (i === 29 || i === 28 || i === 26) {
        square.classList.add('green');
    } else if (i === 27) {
        square.classList.add('blue');
    } else {
        if (i % 2 === 0) {
            square.classList.add('red');
        } else {
            square.classList.add('white');
        }
    }

    // square.textContent = i;

    // Add click event listener
    square.addEventListener('click', () => {
        if (currentPlayer == 1 && autoPlay1.checked) {
            return;
        }
        if (currentPlayer == 2 && autoPlay2.checked) {
            return;
        }

        const i = squares.indexOf(square); 
        if (isAllowedMove(currentPlayer, i, currentRoll)) {
            PerformMove(currentPlayer, i, currentRoll);
        }
    });

    squares.push(square);
  }

  for (let i = 0; i < 10; i++) {
    gameBoard.appendChild(squares[i]);
  }
  for (let i = 19; i >= 10; i--) {
    gameBoard.appendChild(squares[i]);
  }
  for (let i = 20; i < 30; i++) {
    gameBoard.appendChild(squares[i]);
  }

  // Create player tokens
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
        const player1Token = document.createElement('div');
        player1Token.classList.add('token', 'player1-token');
        squares[i].appendChild(player1Token); 
        player1Tokens.push(player1Token); 
    } else {
        const player2Token = document.createElement('div');
        player2Token.classList.add('token', 'player2-token');
        squares[i].appendChild(player2Token); 
        player2Tokens.push(player2Token); 
    }
  }
  // The token on square 10 always actually ends up starting at 11
  const player2Token = document.createElement('div');
  player2Token.classList.add('token', 'player2-token');
  squares[10].appendChild(player2Token); 
  player2Tokens.push(player2Token); 

  function RollDice() {
    let roll = Math.floor(Math.random() * 6) + 1; 
    while (roll === 5) { 
      roll = Math.floor(Math.random() * 6) + 1; 
    }
    diceRollDisplay.textContent = `Roll: ${roll}`;
    return roll;
  }



  // #### Utility functions ####

  function isOccupied(i) {
    if (i >= 30) {
        return false;
    }

    // Check if the square has a player1 token
    if (squares[i].querySelector('.player1-token')) {
      return 1;
    }
  
    // Check if the square has a player2 token
    if (squares[i].querySelector('.player2-token')) {
      return 2;
    }
  
    // If no tokens are found, the square is empty
    return 0;
  }

  function isAllowedMove(player, i, roll) {
    // Can't move a piece that isn't there.
    if (isOccupied(i) != player) {
        return false;
    }
    // Can't move forward onto your own spot.
    const destination = i + roll;
    if (isOccupied(destination) == player) {
        return false;
    }
    // Check for bearing off, only if nothing on first row.
    var firstRow = false;
    for (let i = 0; i < 10; i++) {
        if (isOccupied(i) == player) {
            firstRow = true;
            break;
        }
    }
    if (destination >= 30) {
        return !firstRow;
    }
    // Can't attack a safe square.
    if (isOccupied(destination) != 0 && (destination == 15 || destination == 29 || destination == 28 || destination == 26)) {
        return false;
    }

    // Can't attack a protected token.
    let p = isOccupied(destination);
    if (p != 0 && p != player) {
        if (destination > 0 && isOccupied(destination - 1) == p) {
            return false;
        }
        if (destination < 30 && isOccupied(destination + 1) == p) {
            return false;
        }
    }

    // Can't move past a blocked region.
    var blocked = false;
    var inARow = 0;
    for (let j = i + 1; j <= destination; j++) {
        if (isOccupied(j) != 0 && isOccupied(j) != player) {
            inARow++;
            if (inARow === 3) {
                blocked = true;
                break;
            }
        } else {
            inARow = 0;
        }
    }
    if (blocked) {
        return false;
    }


    return true;
  }

  function HighlightProtected() {
    for (let i = 0; i < 5; i++) {
        player1Tokens[i].classList.remove('protected');
        player2Tokens[i].classList.remove('protected');
    }

    count = 0;
    for (let i = 0; i < 30; i++) {
        if (isProtected(i)) {
            GetToken(i).classList.add('protected');
            count++;
        }
    }
    return count;
  }

  function HighlightBlocks() {
    for (let i = 0; i < 5; i++) {
        player1Tokens[i].classList.remove('block');
        player2Tokens[i].classList.remove('block');
    }

    count = 0;
    for (let i = 0; i < 30; i++) {
        if (isBlock(i)) {
            GetToken(i).classList.add('block');
            count++;
        }
    }
    return count;
  }

  function isProtected(i) {
    p = isOccupied(i);
    if (p == 0) {
        return false;
    }

    if (i > 0 && isOccupied(i - 1) == p) {
        return true;
    }
    if (i < 30 && isOccupied(i + 1) == p) {
        return true;
    }
    return false;
  }

  function isBlock(i) {
    p = isOccupied(i);
    if (p == 0) {
        return false;
    }

    if (i > 0 && i < 30 && isOccupied(i - 1) == p && isOccupied(i + 1) == p) {
        return true;
    }
    if (i > 1 && isOccupied(i - 1) == p && isOccupied(i - 2) == p) {
        return true;
    }
    if (i < 29 && isOccupied(i + 1) == p && isOccupied(i + 2) == p) {
        return true;
    }
    return false;
  }

  function GetToken(i) {
    if (i < 0 || i >= 30) {
        return null;
    }

    let player1Token = squares[i].querySelector('.player1-token');
    let player2Token = squares[i].querySelector('.player2-token');
    let token; 
    if (player1Token) {
        token = player1Token;
    } else if (player2Token) {
        token = player2Token;
    }

    return token;
  }

  function HighlightAvailableMoves(player, roll) {
    for (let i = 0; i < 30; i++) {
        squares[i].classList.remove('available'); 
    }

    count = 0;
    for (let i = 0; i < 30; i++) {
        if (isAllowedMove(player, i, roll)) {
            squares[i].classList.add('available');
            count++;
        }
    }

    // TODO: Consider obligated *reverse* moves if no forward moves are available.

    return count;
  }

  function SetUpTurn() {
    currentRoll = RollDice();
    while (HighlightAvailableMoves(currentPlayer, currentRoll) == 0) {
        if (currentPlayer == 1) {
            SetCurrentPlayer(2);
        } else {
            SetCurrentPlayer(1);
        }
        currentRoll = RollDice();
    }
    HighlightProtected();
    HighlightBlocks();

    if ((autoPlay1.checked && currentPlayer == 1) || (autoPlay2.checked && currentPlayer == 2)) {
        for (let i = 0; i < 30; i++) {
            if (isAllowedMove(currentPlayer, i, currentRoll)) {
                setTimeout(function() {
                    PerformMove(currentPlayer, i, currentRoll);
                }, 500);
                return;
            }
        }
     }
  }

    function EndTurn() {
        if (PlayerWins(currentPlayer)) {
            currentPlayerDisplay.innerText = `Player ${currentPlayer} wins!`;
            return;
        }

        if (currentRoll === 2 || currentRoll === 3) {
            if (currentPlayer == 1) {
                SetCurrentPlayer(2);
            } else {
                SetCurrentPlayer(1);
            }
        }

        SetUpTurn();
    }

    function SetCurrentPlayer(player) {
        currentPlayer = player;
        currentPlayerDisplay.textContent = `Current player: ${currentPlayer}`;
    }

  function PerformMove(player, i, roll) {
    if (player === 0) {
        return;
    }

    start = squares[i];
    let end;
    if (i + roll < 30) {
        end = squares[i + roll];
    }

    // Get the token on the square (check for both player types)
    let player1Token = start.querySelector('.player1-token');
    let player2Token = start.querySelector('.player2-token');
    let startToken; 
    let endToken;
    if (player1Token) {
        startToken = player1Token;
    } else if (player2Token) {
        startToken = player2Token;
    }
    if (i + roll < 30) {
        let player1Token = end.querySelector('.player1-token');
        let player2Token = end.querySelector('.player2-token');
        if (player1Token) {
            endToken = player1Token;
        } else if (player2Token) {
            endToken = player2Token;
        }  
    }

    start.removeChild(startToken);
    if (end) {
        end.appendChild(startToken);
        if (endToken) {
            end.removeChild(endToken);
            start.appendChild(endToken);
            snapSound.play();
        } else {
            clickSound.play();
        }
    } else {
        swipeSound.play();
    }

    EndTurn();
  }

  function PlayerWins(player) {
    for (let i = 0; i < 30; i++) {
        if (isOccupied(i) == player) {
            return false;
        }
    }
    return true;
  }

  function NewGame() {
    SetCurrentPlayer(1);

    for (let i = 0; i < 30; i++) {
        token = GetToken(i);
        if (token != null) {
            squares[i].removeChild(token);
        }
    }
    for (let i = 0; i < 5; i++) {
        squares[2 * i].appendChild(player1Tokens[i]);
    }
    for (let i = 0; i < 4; i++) {
        squares[2 * i + 1].appendChild(player2Tokens[i]);
    }

    HighlightProtected();
    HighlightBlocks();

    squares[10].appendChild(player2Tokens[4]);
}