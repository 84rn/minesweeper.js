// --------------- DATA ----------------


// ------------- CLASSES ---------------

class Board {

    constructor(x, y, size, bombs, tileSize = 50) {
        // Basic config object
        this.config = {
            size,
            tileSize,
            x,
            y,
            bombs,
        };

        this.fields = [];
    }

    init(canvas) {
        this.canvas = canvas;
        // Add background
        this.canvas.addChild(new Rectangle({x: this.config.x, y: this.config.y},
                                           this.config.size * this.config.tileSize,
                                           this.config.size * this.config.tileSize,
                                           '#AA2233', '#550033'));

        this._setupFields();
        this._setupBombs();
        this._setupBombCounts();

        // Add _context to all children automatically
        this.fields.forEach(element => this.canvas.addChild(element));
    }

    _setupFields() {
        // Add fields
        for (let h = 0; h < this.config.size; h++) {
            for (let w = 0; w < this.config.size; w++)
            {
                let field = new Field(this.config.x + w * this.config.tileSize,
                                      this.config.y + h * this.config.tileSize,
                                      this.config.tileSize);
                // Add field coordinates (different than drawing coords)
                field.boardX = w;
                field.boardY = h;

                this.fields.push(field);
            }
        }
    }

    _setupBombs() {
        // Fill with bombs
        let bombIndexes = [];
        for (let bombs = this.config.bombs; bombs > 0; bombs--) {
            let index;
            // Only unique indexes for bombs
            do {
                index = Math.ceil(Math.random() * Field.nextIndex);
            } while(bombIndexes.includes(index));
            bombIndexes.push(index);
        }

        this.fields.filter(element => bombIndexes.includes(element.index)).forEach(element => {
            element.item = new Bomb(element);
        });

    }

    _setupBombCounts() {
        // Count bombs nearby for each field without a bomb
        this.fields.filter(field => !(field.item instanceof Bomb)).forEach(field => {
            field.neighbours = this._getFieldNeighbours(field);
            field.bombsNearby = field.neighbours.filter(field => field.item instanceof Bomb).length;
            if (field.bombsNearby) {
                // Setup text
                let text = new Text(field.bombsNearby);
                text.context = this.canvas.context;
                let metrics = text.metrics;
                let displayCoords = {
                    x: field.x  + (field.size - metrics.width) / 2,
                    y: field.y  + (field.size - text.size) / 2
                };
                field.item = new Text(field.bombsNearby, displayCoords.x, displayCoords.y, '#FF0000');
            }
        });
    }

    _getFieldAt(x, y) {
        return this.fields.find(field => field.boardX == x && field.boardY == y);
    }

    _getFieldNeighbours(field) {
        let neighbourCoords = [
        [field.boardX - 1, field.boardY - 1],
        [field.boardX    , field.boardY - 1],
        [field.boardX + 1, field.boardY - 1],
        [field.boardX - 1, field.boardY],
        [field.boardX + 1, field.boardY],
        [field.boardX - 1, field.boardY + 1],
        [field.boardX    , field.boardY + 1],
        [field.boardX + 1, field.boardY + 1],
        ];

        return neighbourCoords.map(coords => this._getFieldAt(coords[0], coords[1])).filter(field => field);
    }

    click(x, y) {
        if (x >= this.config.x && x < this.config.x + this.config.size * this.config.tileSize &&
            y >= this.config.y && y < this.config.y + this.config.size * this.config.tileSize) {
                // Clicked on the board
                let boardX = x - this.config.x;
                let boardY = y - this.config.y;

                let fieldX = Math.floor(boardX / this.config.tileSize);
                let fieldY = Math.floor(boardY / this.config.tileSize);

                let clickedField = this.fields.find(field => field.boardX == fieldX &&
                                                             field.boardY == fieldY &&
                                                             field.__proto__.hasOwnProperty('click'));

                clickedField.click();
        }
    }

    get width() {
        return this.config.size * this.config.tileSize;
    }
}

class Shape {

    _context = undefined;

    constructor() {

    }

    draw() {

    }

    set context(value) {
        this._context = value;
    }

    get context() {
        return this._context;
    }

    set context(value) {
        this._context = value;
    }
}


class FieldItem extends Shape {

    constructor(field) {
        super();
        this.field = field;
    }

    click() {

    }
}


class Bomb extends FieldItem {

    constructor(field) {
        super(field);
        this.shape = new Circle({x: this.field.x + this.field.size / 2,
                                y: this.field.y + this.field.size / 2},
                                6, '#d96499');
    }

    click() {
        alert("Game over");
    }

    draw() {
       this.shape.draw();
    }

    set context(value) {
        this.shape.context = value;
    }
}


class Field extends Shape {

    item = undefined;

    constructor(x, y, size) {
        super();
        this.x = x;
        this.y = y;
        this.size = size;
        this.shape = new Rectangle({x, y}, size, size, '#0ba0dd', '#1b885e');

        this.uncovered = false;

        Field.nextIndex = Field.nextIndex == undefined ? 0: ++Field.nextIndex;
        this.index = Field.nextIndex;

        this.neighbours = [];
        this.bombsNearby = 0;
    }

    draw() {
            this.shape.draw();

            if (this.uncovered) {
                this.item?.draw();
            }
        }

    click() {
        // console.log(`Clicked on field no. ${this.index} [${this.boardX}, ${this.boardY}]`);
        if (!this.uncovered) {
            this.uncovered = true;
            this.shape.color = '#365393';
            this.shape.borderColor = '#77549d';
            if (this.item?.__proto__.hasOwnProperty('click')) {
                this.item.click();
            }

            // Recursively click on neighbours if no bombs nearby and no bomb on field
            if (!this.bombsNearby && !(this.item instanceof Bomb)) {
                this.neighbours.filter(field => !(field.item instanceof Bomb)).forEach(field => field.click());
            }
        }
    }

    set item(value) {
        this._item = value;
    }

    get item() {
        return this._item;
    }

    set context(value) {
        this._context = value;
        // All shapes within need the context too, take one from parent
        if (this.shape) {
            this.shape.context = value;
        }
        if (this.item) {
            this.item.context = value;
        }
    }
}


class Line extends Shape {

    constructor(pointA, pointB, color) {
        // console.log(`Creating line: [${pointA.x}, ${pointA.y}] [${color}]`);
        super();

        this.pointA = pointA;
        this.pointB = pointB;
        this.color = color;
    }

    draw() {
        this._draw(this.context, this.pointA, this.pointB, this.color);
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


class Circle extends Shape {

    constructor(centerPoint, r, color, borderColor = false) {
        // console.log(`Creating circle: [${centerPoint.x}, ${centerPoint.y}] [${r}] [${color}]`);
        super();

        this.center = centerPoint;
        this.radius = r;
        this.color = color;
        this.borderColor = borderColor;
    }

    draw() {
        this._draw(this.context, this.center, this.radius, this.color);
        if (this.borderColor) {
            this._draw(this.context, this.anchorPoint, this.width, this.height, this.borderColor, false);
        }
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


class Rectangle extends Shape {

    constructor(anchorPoint, width, height, color, borderColor = false) {
        // console.log(`Creating rectangle: [${anchorPoint.x}, ${anchorPoint.y}] [${width}x${height}] [${color}+[${borderColor}]]`);
        super();

        this.anchorPoint = anchorPoint;
        this.width = width;
        this.height = height;
        this.color = color;
        this.borderColor = borderColor;
    }

    draw() {
        this._draw(this.context, this.anchorPoint, this.width, this.height, this.color);
        if (this.borderColor) {
            this._draw(this.context, this.anchorPoint, this.width, this.height, this.borderColor, false);
        }
    }

    _draw(context, anchorPoint, width, height, color, fill = true) {
        if (fill) {
            context.fillStyle = color;
        } else {
            context.strokeStyle = color;
        }

        if (fill) {
            context.fillRect(anchorPoint.x, anchorPoint.y, width, height);
        } else {
            context.strokeRect(anchorPoint.x, anchorPoint.y, width, height);
        }
    }
}


class Text extends Shape {

    constructor(text, x = 0, y = 0, color = 'red') {
        // console.log(`Creating text ${text}`);
        super();
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.textBaseline = 'top';
    }

    set size(value) {
        this._size = value;
    }

    get size() {
        return this._size;
    }

    set font(value) {
        this.font = value;
    }

    get font() {
        return this._font;
    }

    get metrics() {
        this._setParameters();
        return this.context.measureText(this.text);
    }

    _fontStyle() {
        return [this.size + 'px', this.font].join(' ');
    }

    _setParameters() {
        this.context.fillStyle = this.color;
        this.context.font = this._fontStyle();
        // Text (x,y) marks the upper left corner of bounding box
        this.context.textBaseline = this.textBaseline;
    }

    draw() {
        this._setParameters();
        this.context.fillText(this.text, this.x, this.y);
    }

    // Default font size
    _size = 25;
    _font = 'serif';
 }


class Canvas {

    constructor(id, width = undefined, height = undefined) {
        // Get HTML canvas and context
        this._canvas = document.getElementById(id);
        this._context = this._canvas.getContext('2d');

        // Set canvas w x h
        this._context.canvas.width = width ? width : window.innerWidth;
        this._context.canvas.height = height ? height : window.innerHeight;

        this._children = [];
    }

    addChild(child) {
        child.context = this._context;
        this._children.push(child);
        return child;
    }

    get children() {
        return this._children;
    }

    render() {
        this._clearScene();
        this._drawScene();
    }

    _clearScene() {
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    _drawScene() {
        for (let child of this._children) {
            if (child.__proto__.hasOwnProperty('draw')) {
                child.draw();
            }
        }
    }

    get context() {
        return this._context;
    }

    set context(value) {
        this._context = value;
    }
}


class Game {

    constructor(canvas) {
        // Create a basic config object
        this.config = {
            boardSize: 10,
            boardTileSize: 50,
            boardX   : 0,
            boardY   : 0,
            bombs    : 10,
        };

        // Get HTML canvas
        this.canvas = new Canvas(canvas);

        this.config.boardX = (this.canvas.context.canvas.width  - this.config.boardSize * this.config.boardTileSize) / 2;
        this.config.boardY = (this.canvas.context.canvas.height - this.config.boardSize * this.config.boardTileSize) / 2;

        // Bind the function to object for animation callback
        this._loop = this._loop.bind(this);

        // Install some callbacks for input
        this._installEventHandlers();
    }

    start() {
        this.board = new Board(this.config.boardX,
                               this.config.boardY,
                               this.config.boardSize,
                               this.config.bombs,
                               this.config.boardTileSize);

        this.board.init(this.canvas);

        // Install game loop callback
        requestAnimationFrame(this._loop);
    }

    _update(milliseconds) {
        this._moveScene(milliseconds);
    }

    _moveScene(milliseconds) {

    }

    _loop(timestamp) {
        let elapsed = timestamp - this.last;
        this.fps = Math.floor(1000 / elapsed);
        this.last = timestamp;
        ++this.frame;

        this._update(elapsed);
        this.canvas.render();

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
            this.board?.click(point.x, point.y);

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
