// --------------- DATA ----------------


// ------------- CLASSES ---------------

class Board {

    constructor(x, y, size) {
        this.size = size;
        this.xPosition = x;
        this.yPosition = y;
        this.children = [];
        this.tileSize = 50;

        let rect = new Rectangle({x, y}, size * this.tileSize, size * this.tileSize, '#00FF00', '#550033');
        this.children.push(rect);

        for (let h = 0; h < size; h++) {
            for (let w = 0; w < size; w++)
            {
                let field = new Field(x + w * this.tileSize, y + h * this.tileSize, this.tileSize);
                this.children.push(field);
            }
        }
    }

    draw(ctx) {
        for (let child of this.children) {
            child.draw(ctx);
        }

    }

    clicked(x, y) {
        if (x > this.xPosition && x < this.xPosition + this.size * this.tileSize &&
            y > this.yPosition && y < this.yPosition + this.size * this.tileSize) {
            this.children.find((element, index, array) => {
                if (x > element.xPosition && x < element.xPosition + this.tileSize &&
                    y > element.yPosition && y < element.yPosition + this.tileSize &&
                    element.__proto__.hasOwnProperty('clicked')) {
                    return true;
                } else {
                    return false;
                }
            })?.clicked();
        }
    }
}

class Field {

    constructor(x, y, size) {
        this.xPosition = x;
        this.yPosition = y;
        this.rect = new Rectangle({x, y}, size, size, '#AAFFF4', '#FF0000');

        this.uncovered = false;

        Field.nextIndex = Field.nextIndex == undefined ? 0: ++Field.nextIndex;
        this.index = Field.nextIndex;
    }

    draw(ctx) {
        this.rect.draw(ctx);

        if (this.uncovered) {
            this.rect.color = 'coral';
        }
    }

    clicked() {
        console.log(`Clicked on field no. ${this.index}`);
        this.uncovered = true;
    }
}


class Button {

    constructor() {}
}


class Line {

    constructor(pointA, pointB, color) {
        console.log(`Creating line: [${pointA.x}, ${pointA.y}] [${color}]`);
        this.pointA = pointA;
        this.pointB = pointB;
        this.color = color;
    }

    draw(ctx) {
        this._draw(ctx, this.pointA, this.pointB, this.color);
    }

    update(newX, newY) {
        this.pointB = {x: newX, y: newY};
    }

    _draw(ctx, pointA, pointB, color) {
        if (color) {
            ctx.strokeStyle = color;
        }
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.stroke();
    }
}


class Circle {

    constructor(centerPoint, r, color) {
        console.log(`Creating circle: [${centerPoint.x}, ${centerPoint.y}] [${r}] [${color}]`);
        this.center = centerPoint;
        this.radius = r;
        this.color = color;
    }

    draw(ctx) {
        this._draw(ctx, this.center, this.radius, this.color);
    }

    // Add update method with mouse coordinates
    update(newX, newY) {
        this.radius = Math.sqrt(Math.pow(this.center.x - newX, 2) + Math.pow(this.center.y - newY, 2));
    }

    _draw(ctx, centerPoint, r, color, fill = true) {
        if (fill) {
            ctx.fillStyle = color;
        } else {
            ctx.strokeStyle = color;
        }

        ctx.beginPath();
        ctx.arc(centerPoint.x, centerPoint.y, r, 0, 2 * Math.PI);

        if (fill) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }
}


class Rectangle {

    constructor(anchorPoint, width, height, color, borderColor = false) {
        console.log(`Creating rectangle: [${anchorPoint.x}, ${anchorPoint.y}] [${width}x${height}] [${color}+[${borderColor}]]`);
        this.anchorPoint = anchorPoint;
        this.width = width;
        this.height = height;
        this.color = color;
        this.borderColor = borderColor;
    }

    draw(ctx) {
        this._draw(ctx, this.anchorPoint, this.width, this.height, this.color);
        if (this.borderColor) {
            this._draw(ctx, this.anchorPoint, this.width, this.height, this.borderColor, false);
        }
    }

    // Add update method with mouse coordinates
    update(newX, newY) {
        this.width = newX - this.anchorPoint.x;
        this.height = newY - this.anchorPoint.y;
    }

    _draw(ctx, anchorPoint, width, height, color, fill = true) {
        if (fill) {
            ctx.fillStyle = color;
        } else {
            ctx.strokeStyle = color;
        }

        if (fill) {
            ctx.fillRect(anchorPoint.x, anchorPoint.y, width, height);
        } else {
            ctx.strokeRect(anchorPoint.x, anchorPoint.y, width, height);
        }
    }
}


class Game {
    constructor(canvasID) {
        // Get HTML canvas
        this.canvas = document.getElementById(canvasID);
        this.ctx = this.canvas.getContext('2d');

        // Set canvas w x h
        this.ctx.canvas.width = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;

        // Canvas animation data
        this.frame = 0n;
        this.last = 0;
        this.fps = 0;

        this.drawableObjects = [];
        this.currentlyDrawn = undefined;

        // Bind the function to object for animation callback
        this._loop = this._loop.bind(this);

        this._installEventHandlers();
    }

    start() {

        // 10x10 board
        let boardSize = 10;

        this.board = new Board(100, 100, boardSize);
        this.drawableObjects.push(this.board);

        requestAnimationFrame(this._loop);
    }

    _drawFPS(x = 0, y = 40) {
        this.ctx.clearRect(0, 0, 60, 50);
        this.ctx.font = '48px serif';
        this.ctx.fillText(this.fps, x, y);
    }

    _drawObjectNumber(array, x = 0, y = 40) {
        this.ctx.clearRect(0, 0, 160, 50);
        this.ctx.font = '48px serif';
        this.ctx.fillText(array.length, x, y);
    }

    _drawObjects() {
        for (let ob of this.drawableObjects) {
            ob.draw(this.ctx);
        }
    }

    _drawScene() {
        this._drawObjects();
        // this._drawObjectNumber(this.drawableObjects);
        this._drawFPS();
    }

    _render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawScene();
    }

    _update(milliseconds) {
        this._moveScene(milliseconds);
    }

    _moveScene(milliseconds) {
        // drawableObjects.push(new RandomObject());
    }

    _loop(timestamp) {
        let elapsed = timestamp - this.last;
        this.fps = Math.floor(1000 / elapsed);
        this.last = timestamp;
        ++this.frame;

        this._update(elapsed);
        this._render();

        requestAnimationFrame(this._loop);
    }

    _installEventHandlers() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);
    }

    // --------------- EVENT HANDLERS --------------

    onMouseMove(event) {
        let point = {
            x: event.clientX,
            y: event.clientY
        };

        // Left mouse button
        if (event.buttons == 1)  {

        }
    }

    onMouseDown(event) {
        let point = {
            x: event.clientX,
            y: event.clientY
        };

        // Left mouse button
        if (event.buttons == 1) {
            // Check for clicks on board
            this.board?.clicked(point.x, point.y);

        } else if (event.buttons == 4) {

        }
    }

    onMouseUp(event) {
        let point = {
            x: event.clientX,
            y: event.clientY
        };
    }
}


// ---------------- CODE ----------------

game = new Game('app-canvas');
game.start();
