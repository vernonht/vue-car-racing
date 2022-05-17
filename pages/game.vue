<template>
    <div class="box">
        <div class="flex">
            <pre id="speed">speed {{currentSpeed}}</pre>
            <div class="ml-auto">
                <button class="border hover:bg-grey-200 rounded w-10 mr-2"type="button" name="button" @click="currentSpeed++">+</button>
                <button class="border hover:bg-grey-200 rounded w-10"type="button" name="button" @click="currentSpeed--">-</button>
            </div>
        </div>
        <div class="hidden">
            <audio controls autoplay loop id="audio">
                <source src="Guitar-Mayhem-5.mp3" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        </div>
        <canvas id="canvas" :width="data.canvas.width" :height="data.canvas.height" tabindex="0"></canvas>
        <pre id="score">0</pre>
        <div class="flex flex-col px-10" id="instruction">
            <div>Press "Enter" key to start the game.</div>
            <div>Controls:</div>
            <div>"Left" Arrow key</div>
            <div>"Right" Arrow key</div>
        </div>
        <pre id="lose">You lose! Try again?</pre>
        <div class="flex justify-between my-4">
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="left">
                <
            </div>
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="start">
                Start
            </div>
            <div class="flex items-center justify-center shadow hover:shadow-lg border rounded-full w-16 h-16" @click="right">
                >
            </div>
        </div>
        <div class="flex flex-col justify-end">
            <span class="text-right">Inspired by Takane Ichinose</span>
            <span class="text-right">
                <a href="https://codepen.io/takaneichinose/pen/MjNpXb">https://codepen.io/takaneichinose/pen/MjNpXb</a>
            </span>
        </div>
    </div>
</template>

<script>


export default {
    data() {
        return {
            data: {
                fps: 180,
                speed: 10,
                canvas: {
                    width: 420,
                    height: 480
                },
                car1: {
                    width: 80,
                    height: 120,
                    turn: 25,
                    image: this.base64ToImg("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAB4CAYAAAES6UVgAAAABGdBTUEAALGPC/xhBQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+ALAQYyDYKwsygAAAAdaVRYdENvbW1lbnQAAAAAAENyZWF0ZWQgd2l0aCBHSU1QZC5lBwAABM1JREFUeNrtnLGL3EYUxn9S1sRFFpbksFFsSGmz/4APN07cHITDJLg4cOMiKQzmCsMdJEVc+B9w4+JgO4PBENyk2TJujMFdXIYUd02OYFKEDbi44EkhaU+rk1Yj7Wg1e/d98Ni7lTTz7TdvZp7ejAQncRU4AvrZL4PM34ZyBGF6kik5LfneBBalAdAD/gKIoqj0pMPDQ8Ioii5ggRBL9LLFOynR/YmBjYYzP6ZSxzpVY1t9Hi+BUVmJ80oNpvIYU151eqyePPOkSeUJoigy7t2sysWiKFodN7PR0X3VZXiQFFBl/Xnu2DOGI4AgsK85HQSDIC5roR5TgB8DYB14baN6VYukDvEahwijKFqIWb4T9IpoL8QQxziDBc70UVd+6Bx/Wg4EVmYbEtWdTediB/gH+APYbFqiacooLCiozk83yWh1Ent7GGMwe3v2DWBMbMD4RE3DYXxwOGxUoAEutzFiB6HDwgCG067notutyPDlaj6pHVh19pOtb0U0SanAlY0cnPaUMzQeet8oIXDDYXk3nM/LTS76Apg0jB932ghwb7oMcAusWduncVUmtnJuGxvHddy+ze/WIem7d8cXGhP/3wbBbB0ZIR6WEdvKXnz9Oub9+/izzSYejWKravrvW/azxv5ZOCy4jBabTiIJ/gspSHt6hF6YNK+3CPEcvay/uQrXXd3prIaClr1JPiiCIiiCItgRnN8nLmUm8SgelA+qk3ih4JrvCs7ctPvGzXsfXBR94vXGEfHa4xHxOuRL4kzW1S5I7TTMEkyIU3etKeUypfHAJbk2cy83FyG2zhKTRLXw+DH7ac5ue7s9YrncoPWIMi5JLDq13d3ZOnZ3MWXRVRYPKc98OrWDg9k6Dg6qm/sy81OzTm0wmK1jMKj2yZkCxuPY2uwcly5hJpP4M3dsK0/uBzxM/y5rrGtq08Tq0FOC0yT6Ub57e3TTFIQ2Y0+HWPc9HvzOd4K3fCd4QffFC+dm0iHFxzUSpT5E0NsEppbCRFAERVAERVAERVAERVAELbESy7Grd0+iTRXqxSIogppJpODpamI8bubp+5YCz4h9nXJy/ZoE1y17+vdu1cVF4BvgKe7Xlp8mZV88DUKdB74F9ul+0X4/4XLeZ8E+Bu7j786HvN1POHeKAfB8hUQrs+fJb1kO7t3j5/E4fmp2PG7/yVla3pY1GsVbs0YjzJUr/NKWbufW13mb3xCXtTov1Ona8pvu8ra2xm/AOVfxxDMKHijPW1sPmLOEbZV5y2yzfFYVhM6LszaBD8AdgBcv5itdddwnPHliffxOosFmXa97U9Ry29vFLdbmFmaW8G6HrG1slF7zpsgb8198QvwsgFCOPvBvURfuSzwrTMi8WDTIfH6QNrVzRSZdenhUdXZXyxFdwWJL2CPgpwD4FPhbAtYWEOCzkIKHIQRrbIXAXenQGHdD4Jp0aIxryvg6mIoFCdgdekXhiU/b4n1CkVbyQHVhCSgBz/Qk4vjeUB4oSEAJKAEloCABJaAElICCBJSAElACChJQAkrAUwvvH4iUB0pAYR6s10S0P1AeqC4sASWgIAEloO5E5IHCMT5KvPBLSdG8C5MI+KvkqI2v8l98Drxi9V8k0aa9SnSa8cA8NLHM77GaRDQLe4L/AQwSmpBDGIdrAAAAAElFTkSuQmCC"),
image: this.base64ToImg('/socargame-06.png'),
                    position: {
                        x: 130,
                        y: 340
                    }
                },
                car2: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: this.base64ToImg('./socargame-03.png')
                },
                car3: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: this.base64ToImg('./socargame-04.png')
                },
                car4: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: this.base64ToImg('./socargame-05.png')
                },
                car5: {
                    width: 80,
                    height: 120,
                    distance: 350,
                    image: this.base64ToImg('./socargame-07.png')
                },
                line: {
                    width: 10,
                    height: 80,
                    distance: 120,
                    pos0: 15,
                    pos1: 115,
                    pos2: 215,
                    pos3: 315,
                    color: "#efefef"
                },
                moves: [30, 130, 230, 330],
                score: 1,
                grace: 10
            },
            currentSpeed: 10,
            game: false,
            muted: false,
            die: false,
            car1Move: 0,
            car1Turn: 0,
            score: 0,
            lines: [],
            car1: [],
            car2: [],
            canvas: '',
            context: '',
            instruction: '',
            scoreText: '',
            lose: '',
        }
    },
    watch: {
        muted: function (val) {
            $('#audio').prop("muted", val);
            const audio = document.getElementById('audio');
            if (val) {
                audio.pause(); audio.currentTime = 0;
            }
            else audio.play();
        },
    },
    mounted() {
        this.muted = true;
        this.canvas =  document.querySelector("#canvas");
        this.context =  canvas.getContext("2d");
        this.instruction =  document.querySelector("#instruction");
        this.scoreText =  document.querySelector("#score");
        this.lose =  document.querySelector("#lose");

        window.addEventListener("keydown", (evt)=> {
          evt.preventDefault();

          if (!this.game) {
            if (evt.keyCode === 13) { //enter
              this.start()
            }
          }

          if (this.car1Move <= 0 && this.car1Turn <= 0) {
            if (evt.keyCode === 37) { //left
              this.left()
            }
            else if (evt.keyCode === 39) { //right
              this.right()
            }
          }
        });
        this.render()
    },
    methods: {
        left() {
            if (this.car1[0] === this.data.moves[1]) {
              this.car1Move = this.data.moves[0];
              this.car1Turn = 1;
            }
            else if (this.car1[0] === this.data.moves[2]) {
              this.car1Move = this.data.moves[1];
              this.car1Turn = 1;
            }
            else if (this.car1[0] === this.data.moves[3]) {
              this.car1Move = this.data.moves[2];
              this.car1Turn = 1;
            }
        },
        right() {
            if (this.car1[0] === this.data.moves[0]) {
              this.car1Move = this.data.moves[1];
              this.car1Turn = 2;
            }
            else if (this.car1[0] === this.data.moves[1]) {
              this.car1Move = this.data.moves[2];
              this.car1Turn = 2;
            }
            else if (this.car1[0] === this.data.moves[2]) {
              this.car1Move = this.data.moves[3];
              this.car1Turn = 2;
            }
        },
        start() {
            this.muted = false
            this.game = true;
            this.instruction.style.display = "none";
            this.lose.style.display = "none";

            this.initialize();
        },
        base64ToImg(value) {
            var img = new Image();
            img.src = value;
            return img;
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.data.canvas.width, this.data.canvas.height);
        },
        initLines() {
            var y = this.data.canvas.height - this.data.line.height;

            while (y >= 0) {
                this.lines.push([
                    [this.data.line.pos0, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos1, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos2, y, this.data.line.width, this.data.line.height],
                    [this.data.line.pos3, y, this.data.line.width, this.data.line.height]
                ]);

                y -= this.data.line.distance;
            }
        },
        initCar1() {
            this.car1 = [this.data.car1.position.x, this.data.car1.position.y, this.data.car1.width, this.data.car1.height];
        },
        initCar2() {
            for (var i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                var random = this.data.moves[Math.floor(Math.random() * 4)];

                let min = Math.ceil(2);
                let max = Math.floor(5);
                let rand = Math.floor(Math.random() * (max - min + 1)) + min;
                if (this.car2.length > 0) {
                    if (random === this.car2[this.car2.length - 1][1]) {
                        i--;
                    }
                    else {
                        this.car2.push([random, this.data.car2.height * -1, this.data[`car${rand}`].image]);
                    }
                }
                else {
                    this.car2.push([random, this.data.car2.height * -1, this.data[`car${rand}`].image]);
                }
            }
        },
        drawLines() {
            var remove = false;

            this.context.fillStyle = this.data.line.color;

            for (var i = 0; i < this.lines.length; i++) {
                this.context.fillRect(this.lines[i][0][0], this.lines[i][0][1], this.lines[i][0][2], this.lines[i][0][3]);
                this.context.fillRect(this.lines[i][1][0], this.lines[i][1][1], this.lines[i][1][2], this.lines[i][1][3]);
                this.context.fillRect(this.lines[i][2][0], this.lines[i][2][1], this.lines[i][2][2], this.lines[i][2][3]);
                this.context.fillRect(this.lines[i][3][0], this.lines[i][3][1], this.lines[i][3][2], this.lines[i][3][3]);

                if (this.lines[i][0][1] > this.data.canvas.height) {
                    remove = i;
                }
                else {
                    this.lines[i][0][1] += this.currentSpeed;
                    this.lines[i][1][1] += this.currentSpeed;
                    this.lines[i][2][1] += this.currentSpeed;
                    this.lines[i][3][1] += this.currentSpeed;
                }
            }

            if (this.lines[this.lines.length - 1][0][1] > this.data.line.distance - this.data.line.height) {
                this.lines.push([
                    [this.data.line.pos0, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos1, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos2, (this.data.line.height * -1), this.data.line.width, this.data.line.height],
                    [this.data.line.pos3, (this.data.line.height * -1), this.data.line.width, this.data.line.height]
                ]);
            }

            if (remove) {
                this.lines.splice(remove, 1);
            }
        },
        drawCar1() {
            if (this.car1Move > 0 && this.car1Turn > 0) {
                if (this.car1Turn === 1) {
                    if (this.car1[0] > this.car1Move) {
                        this.car1[0] -= this.data.car1.turn;
                    }
                    else {
                        this.car1[0] = this.car1Move;
                        this.car1Move = 0;
                        this.car1Turn = 0;
                    }
                }
                else if (this.car1Turn === 2) {
                    if (this.car1[0] < this.car1Move) {
                        this.car1[0] += this.data.car1.turn;
                    }
                    else {
                        this.car1[0] = this.car1Move;
                        this.car1Move = 0;
                        this.car1Turn = 0;
                    }
                }
            }
            this.context.drawImage(this.data.car1.image, this.car1[0], this.car1[1], this.car1[2], this.car1[3]);
        },
        drawCar2() {
            var remove = false;
            let min = Math.ceil(2);
            let max = Math.floor(5);
            let rand = Math.floor(Math.random() * (max - min + 1)) + min;
            for (var i = 0; i < this.car2.length; i++) {
                if (this.car2[i][1] > this.data.canvas.height) {
                    remove = i;
                }
                else {
                    this.car2[i][1] += this.currentSpeed;
                }
                this.context.drawImage(this.car2[i][2], this.car2[i][0], this.car2[i][1], this.data.car2.width, this.data.car2.height);
            }

            if (this.car2[this.car2.length - 1][1] > this.data.car2.distance) {
                this.initCar2();
            }

            if (remove) {
                this.car2.splice(remove, 1);
            }
        },
        collision() {
            for (var i = 0; i < this.car2.length; i++) {
                if (
                    this.car1[0] + this.data.grace <= this.car2[i][0] + this.data.car2.width
                    && this.car1[0] + this.data.car1.width - this.data.grace >= this.car2[i][0]
                    && this.car1[1] + this.data.grace <= this.car2[i][1] + this.data.car2.height
                    && this.car1[1] + this.data.car2.height - this.data.grace >= this.car2[i][1]
                ) {
                    this.die = true;
                    this.game = false;
                    this.instruction.style.display = "block";
                    this.lose.style.display = "block";
                    this.muted = true
                }
            }
        },
        incrementScore() {
            this.score += this.data.score;

            this.scoreText.innerHTML = this.score;
        },
        render(callback) {
            setTimeout(()=> {
                requestAnimationFrame(this.render);
                // if(this.score) {
                //  this.currentSpeed = 10 + (this.score/100)
                // }
                if (!this.die && this.game) {
                    this.clearCanvas();
                    this.drawLines();
                    this.drawCar1();
                    this.drawCar2();
                    this.collision();
                    this.incrementScore();
                }
            }, 1000 / this.data.fps);
        },
        initialize() {
            this.die = false;
            this.score = 0;
            this.car1Move = 0;
            this.car1Turn = 0;
            this.lines = [];
            this.car1 = [];
            this.car2 = [];

            this.initLines();
            this.initCar1();
            this.initCar2();
            this.clearCanvas();
        },
    }
}
</script>
<style media="screen" scoped>

.box {
    width: 420px;
position: absolute;
top: calc(50% - 240px);
left: calc(50% - 170px);
}

#canvas {
background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAHgCAIAAAEs6ROFAAAABGdBTUEAALGPC/xhBQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+ALAQoxK3KKnHIAAAAdaVRYdENvbW1lbnQAAAAAAENyZWF0ZWQgd2l0aCBHSU1QZC5lBwAABdZJREFUeNrt3UGK8zoQhVEpi7D2v7zSJioDh+BAJg5ERtY5w8cDUfn6Nj80TdfMUkppbSsDRfRHuYiHPexhD3vYwx72sIc97GEPe9jDHvawhz3sYQ972MMe9rCHPezhX9TxP1uM6Bp72MMe9rCHPexhD3vYwx72sIc97GEPe9jDHvawhz3sYQ972MOzPfz62eJu8G8vjrT/QPPKT3q5Ly0HO9jBDnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnbwpJb43cP3Lx76knawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOdrCDHexgBzvYwQ52sIMd7GAHO9jBDnawgx3sYAc72MEOdrCDHexgBzv4jI+/e3h017+BeGPHP++47le0b1kIjMAIjMAIjMACIzACIzACIzACI7DACIzACIzACIzAAiMwAiMwAiMwAgvsIxAYgREYgREYgRFYYARGYARGYARGYIERGIERGIERGIERWGAERmAERmAERmCBERiBERiBERiBBUZgBEZgBEZgBEZggREYgREYgREYgQVGYARGYARGYAQWGIERGIERGIERGIEFRmAERmAERmAEFhiBERiBERiBERiBBUZgBEZgBEZgBF5LzfzyX1vbfDRziegW7Fs0AiMwAiMwAiOwwD4CgREYgREYgREYgQVGYARGYARGYAQWGIERGIERGIERGIEFRmAERmAERmAEFhiBERiBERiBEVhgBEZgBEZgBEZgBBYYgREYgREYgRFYYARGYARGYARGYIERGIERGIERGIERWGAERmAERmAERmCBERiBERiBERiBEVhgBEZgBEZgBEZggREYgREYgREYgQVGYARGYARGYARGYIERGIERGIERGIEFRmAERmAERmAEFhiBERiBERiBERiBBUZgBEZgBEZgBBYYgREYgREYgREYgQVGYARGYARGYAQWGIERGIERGIERWGAERmAERmAERmAEFhiBERiBERiBEVhgBEZgBEZgBEZggREYgREYgREYgRFYYARGYARGYARGYIERGIERGIERGIERWGAERmAERmAERmCBERiBERiBERiBBUZgBEZgBEZgBEZggREYgREYgREYgQVGYOZRM0/8361tPjL4q4juOzT4JxZgwIABAwYMBgwYMGDAYMCAAQMGDBgwGDBgwIABAwYMBgwYMGDAYMCAAQMGDBgwGDBgwIABAwYMBgwYMGDAYMCAAQMGDBgwGDBgwIABgwEDBgwYMGDAYMCAAQMGDBgwGDBgwIABgwEDBgwYMGDAYMCAAQMGDBgwGDBgwIABgwEDBgwYMGDAYMCAAQMGDBgwGDBgwIABgwEDBgwYMGDAYMCAAQMGDAYMGDBgwIABgwEDBgwYMGDAYMCAAQMGDAYMGDBgwIABgwEDBgwYMGDAYMCAAQMGDAYMGDBgwIABgwEDBgwYMBgwYMCAAQMGDAYMGDBgwIABgwEDBgwYMBgwYMCAAQMGDAYMGDBgwIABgwEDBgwYMBgwYMCAAQMGDAYMGDBgwIABgwEDBgwYMBgwYMCAAQMGDAYMGDBgwGDAgAEDBgwYMBgwYMCAAQMGDAYMGDBgwGDAgAEDBgwYMBgwYMCAAQMGDAYMGDBgwGDAgAEDBgwYMBgwYMCAAQMGDAYMGDBgwGDAgAEDBgwYMBgwYMCAAYMBAwYMGDBgwGDAgAEDBgwYMBgwYMCAAYMBAwYMGDBgwGDAgAEDBgwYMBgwYMCAAYMBAwYMGDBgwGDAgAEDBgwG7CMAAwYMGDBgMGDAgAEDBgwYDBgwYMCAwYABAwYMGDBgMGDAgAEDBgwYDBgwYMCAwYABAwaGeALhgyn0oJdhpwAAAABJRU5ErkJggg==");
background: url('/socargame-01.png');
margin: 0 auto;
outline: none;
}

#score {
font-size: 20px;
font-weight: bold;
color: white;
display: block;
position: absolute;
top: 30px;
left: 10px;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

#instruction {
width: 100%;
font-size: 14px;
font-weight: bold;
color: white;
display: block;
position: absolute;
top: 200px;
left: 0;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}

#lose {
width: 100%;
font-size: 14px;
font-weight: bold;
color: white;
display: none;
position: absolute;
top: 150px;
left: 30px;
text-shadow: -2px 0 black, -2px 2px black, -2px -2px black, 0 2px black, 2px 0 black, 2px 2px black, 2px -2px black, 0 -2px black;
}
</style>
