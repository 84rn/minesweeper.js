// --------------- DATA ----------------


// ------------- CLASSES ---------------

class Board {

    constructor(x, y, size) {
        this.size = size;
        this.tileSize = 50;
        this.xPosition = x;
        this.yPosition = y;
        this.bombNumber = 60;

        this.children = [];
        this.fields = []

        // Add background
        let rect = new Rectangle({x, y}, size * this.tileSize, size * this.tileSize, '#00FF00', '#550033');
        this.children.push(rect);

        // Add fields
        for (let h = 0; h < size; h++) {
            for (let w = 0; w < size; w++)
            {
                let field = new Field(x + w * this.tileSize, y + h * this.tileSize, this.tileSize);
                field.x = w;
                field.y = h;

                this.children.push(field);
                this.fields.push(field);

            }
        }

        // Fill with bombs
        for(let num = this.bombNumber; num > 0; --num) {
            let randomIndex = Math.floor(Math.random() * Field.nextIndex);
            let field = this.fields.find((element, index, array) => {
                if (element.index == randomIndex) {
                    console.log(`RETURNING FIELD ${element.index}`);
                    return true;
                }

                return false;
            });
            field.item = new Bomb(field);
        }

        // Count bombs nearby for each field without a bomb
        for (let field of this.fields) {
            if (field.item instanceof Bomb)
                continue;
            field.neighbours = this._getFieldNeighbours(field);
            field.bombsNearby = field.neighbours.filter((element) => {
                return element.item instanceof Bomb;
            }).length;

        }

    }

    _getFieldAt(x, y) {
        return this.fields.find((element) => {
            if (element.x == x && element.y == y) {
                return true;
            }
            return false;
        });
    }

    _getFieldNeighbours(field) {
        let neighbourCoords = [
        [field.x - 1, field.y - 1],
        [field.x, field.y - 1],
        [field.x + 1, field.y - 1],
        [field.x - 1, field.y],
        [field.x + 1, field.y],
        [field.x - 1, field.y + 1],
        [field.x, field.y + 1],
        [field.x + 1, field.y + 1],
        ];

        let neighbours = [];

        for (let neighbour of neighbourCoords) {
            let field = this._getFieldAt(neighbour[0], neighbour[1]);
            if (field) {
                neighbours.push(field)
            }
        }

        return neighbours;
    }

    draw(ctx) {
        for (let child of this.children) {
            child.draw(ctx);
        }
    }

    clicked(x, y) {
        if (x > this.xPosition && x < this.xPosition + this.size * this.tileSize &&
            y > this.yPosition && y < this.yPosition + this.size * this.tileSize) {
            let clickedField = this.children.find((element, index, array) => {
                if (x > element.xPosition && x < element.xPosition + this.tileSize &&
                    y > element.yPosition && y < element.yPosition + this.tileSize &&
                    element.__proto__.hasOwnProperty('clicked')) {
                    return true;
                } else {
                    return false;
                }
            })

            clickedField?.clicked(x - clickedField.xPosition, y - clickedField.yPosition);
        }
    }
}


class FieldItem {

    constructor(field) {
        this.field = field;
    }

    clicked() {

    }

    draw(ctx) {

    }
}


class Bomb extends FieldItem {

    constructor(field) {
        super(field);
        this.circle = new Circle({x: this.field.xPosition + this.field.size / 2,
                                y: this.field.yPosition + this.field.size / 2},
                                6, '#FFFF00');
    }

    clicked() {
        console.log("BOMB");
    }

    draw(ctx) {
       this.circle.draw(ctx);
    }
}


class Field {

    constructor(x, y, size) {
        this.xPosition = x;
        this.yPosition = y;
        this.size = size;
        this.rect = new Rectangle({x, y}, size, size, '#AAFFF4', '#FF0000');

        this.uncovered = true;

        Field.nextIndex = Field.nextIndex == undefined ? 0: ++Field.nextIndex;
        this.index = Field.nextIndex;

        this.neighbours = [];
    }

    draw(ctx) {
        this.rect.draw(ctx);

        if (this.uncovered) {
            if (this.bombsNearby) {
                ctx.font = '48px serif';
                ctx.fillStyle = '#FF0000'
                ctx.fillText(this.bombsNearby, this.xPosition + 10, this.yPosition + 42);
            } else {
                this.item?.draw(ctx);
            }
        }
    }

    clicked(x, y) {
        console.log(`Clicked on field no. ${this.index} [${this.x}, ${this.y}][${x}, ${y}]`);
        if (!this.uncovered) {
            this.uncovered = true;
            this.item?.clicked();
        }
    }

    set item(value) {
        this._item = value;
    }

    get item() {
        return this._item;
    }

    _item = undefined;
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
