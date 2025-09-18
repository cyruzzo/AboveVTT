class WeatherOverlay {
    constructor(canvas, lightCanvas, type = 'rain') {
        
        this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lightCanvas = lightCanvas;
        this.lightCtx = lightCanvas.getContext('2d');  
        this.type = type;
        this.particles = [];
        this.animationId = null;
        this.width = canvas.width;
        this.height = canvas.height;
        this._initParticles();
    }
    setType(type) {
        this.type = type;
        this._initParticles();
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.offscreenCanvas.width = width;
        this.offscreenCanvas.height = height;
        this._initParticles();
    }

    _initParticles() {
        this.particles = [];
        let count;
        if (this.type === 'fog') count = 10;
        else if (this.type === 'rain') count = 120;

        else if (this.type === 'snow') count = 120;
        else if (this.type === 'embers') count = 40;
        else if (this.type === 'cherryBlossoms') count = 40;
        else if (this.type === 'lightning') count = 60;
        else if (this.type === 'faerieLight') count = 23;
        else if (this.type === 'fireflies') count = 28;
        else if (this.type === 'leaves' || this.type === 'greenLeaves') count = 32;
        else count = 60;

        if (this.type === 'fog' || this.type === 'embers' || this.type === 'cherryBlossoms') {
            const angle = Math.random() * Math.PI * 2;
            this._windAngle = angle;
            this._windSpeed = 0.08 + Math.random() * 0.1;
            this._windDx = Math.cos(angle) * this._windSpeed;
            this._windDy = Math.sin(angle) * this._windSpeed;
        }


        const fadeInFrames = 60;

        if (this.type === 'rain' || this.type === 'lightning') {
            for (let i = 0; i < count; i++) {
                const id = i + '_' + Math.floor(Math.random() * 1000000);
                const startX = this.width / 2;
                const startY = 0;
                const endX = Math.random() * this.width;
                const endY = Math.random() * this.height;
                const wind = -0.7 + Math.random() * 1.4;
                this.particles.push({
                    id,
                    startX,
                    startY,
                    endX,
                    endY,
                    z: 0,
                    fadeIn: 0,
                    fadeInFrames,
                    splash: false,
                    splashed: false
                });
                this.particles.push({
                    dropletId: id,
                    splash: true,
                    x: endX,
                    y: endY,
                    r: 3 + Math.random() * 2,
                    life: 0,
                    maxLife: 18 + Math.random() * 10,
                    fadeIn: 0,
                    fadeInFrames: 10
                });
            }
        } else if (this.type === 'leaves' || this.type === 'greenLeaves') {
            const windAngle = Math.random() * Math.PI * 2;
            const windSpeed = 0.18 + Math.random() * 0.12;
            this._leavesWindDx = Math.cos(windAngle) * windSpeed;
            this._leavesWindDy = Math.sin(windAngle) * windSpeed;
            for (let i = 0; i < count; i++) {
                const windVar = 0.06 + Math.random() * 0.08;
                const windAngleVar = windAngle + (-0.18 + Math.random() * 0.36);
                const r = 8 + Math.random() * this.width/200;
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    r,
                    alpha: 0.7 + Math.random() * 0.3,
                    angle: Math.random() * Math.PI * 2,
                    spin: -0.02 + Math.random() * 0.04,
                    windDx: this._leavesWindDx + Math.cos(windAngleVar) * windVar,
                    windDy: this._leavesWindDy + Math.sin(windAngleVar) * windVar,
                    pathVar: Math.random() * 1000,
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'snow') {
            for (let i = 0; i < count; i++) {
                const groundX = Math.random() * this.width;
                const groundY = Math.random() * this.height;
                this.particles.push({
                    startX: groundX,
                    startY: groundY - this.height * 0.5 - Math.random() * this.height * 0.5,
                    groundX: groundX,
                    groundY: groundY,
                    z: Math.random(),
                    r: 3 + Math.random() * 5,
                    alpha: 0.7 + Math.random() * 0.3,
                    drift: 1 + Math.random() * 100, 
                    speed: 0.0001 + Math.random() * 0.0002, 
                    phase: Math.random() * Math.PI * 2,
                    angle: Math.random() * Math.PI * 2,
                    spin: -0.01 + Math.random() * 0.02,
                    wind: 0.001 + Math.random() * 0.025,
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'fog') {
            for (let i = 0; i < count; i++) {
                const baseR = 200 + Math.random() * this.width/100;
                const aspect = 0.6 + Math.random() * 0.8;
                this.particles.push({
                    x: Math.random() * (this.width + 200) - 100,
                    y: Math.random() * (this.height + 120) - 60,
                    r: baseR,
                    aspect: aspect,
                    alpha: 0.1 + Math.random() * 0.05,
                    phase: Math.random() * Math.PI * 2,
                    fadeIn: 1,
                    fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'embers') {
            for (let i = 0; i < count; i++) {
                let baseX = Math.random() * (this.width + 40) - 20;
                let baseY = Math.random() * (this.height + 40) - 20;
                this.particles.push({
                    x: baseX,
                    y: baseY,
                    r: 1 + Math.random() * 1,
                    alpha: 0.7 + Math.random() * 0.3,
                    speed: 0.3 + Math.random() * 0.3,
                    drift: -0.2 + Math.random() * 0.4,
                    windDx: this._windDx,
                    windDy: this._windDy,
                    life: 0,
                    maxLife: 120 + Math.random() * 60,
                    color: Math.random() > 0.5 ? 'rgba(255,180,60,1)' : 'rgba(255,100,0,1)',
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'cherryBlossoms') {
            for (let i = 0; i < count; i++) {
                let baseX = Math.random() * (this.width + 40) - 20;
                let baseY = Math.random() * (this.height + 40) - 20;
                this.particles.push({
                    type: 'blossom',
                    x: baseX,
                    y: baseY,
                    r: 6 + Math.random() * 4,
                    alpha: 0.7 + Math.random() * 0.3,
                    drift: -0.5 + Math.random(),
                    speed: 0.2 + Math.random() * 0.2,
                    phase: Math.random() * Math.PI * 2,
                    angle: Math.random() * Math.PI * 2,
                    spin: -0.03 + Math.random() * 0.06,
                    windDx: this._windDx,
                    windDy: this._windDy,
                    pathVar: Math.random() * 1000,
                    petalColor: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.85)`,
                    tipColor: `rgba(255,${120+Math.floor(Math.random()*60)},${200+Math.floor(Math.random()*40)},0.95)`,
                    centerColor: 'rgba(255,220,230,0.7)',
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
                this.particles.push({
                    type: 'petal',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    r: 2.5 + Math.random() * 2.5,
                    alpha: 0.5 + Math.random() * 0.4,
                    drift: -0.7 + Math.random() * 1.4,
                    speed: 0.12 + Math.random() * 0.13,
                    phase: Math.random() * Math.PI * 2,
                    angle: Math.random() * Math.PI * 2,
                    spin: -0.04 + Math.random() * 0.08,
                    windDx: this._windDx * 1.1,
                    windDy: this._windDy * 1.1,
                    pathVar: Math.random() * 1000,
                    color: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.82)`,
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'faerieLight' ||  this.type === 'fireflies') {
            for (let i = 0; i < count; i++) {
                const r = 1 + Math.random() * 2;
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    r,
                    baseR: r,
                    alpha: 0.7 + Math.random() * 0.3,
                    hue: Math.random() * 360,
                    speed: 0.1 + Math.random() * 0.15,
                    angle: Math.random() * Math.PI * 2,
                    drift: -0.5 + Math.random(),
                    phase: Math.random() * Math.PI * 2,
                    fadeIn: 0,
                    fadeInFrames: fadeInFrames
                });
            }
        }
    }

    _drawLeaves() {
        const t = Date.now() * 0.001;
        this.particles = this.particles.filter(p =>
            p.x >= -32 && p.x <= this.width + 32 &&
            p.y >= -32 && p.y <= this.height + 32
        );
        while (this.particles.length < 32) {
            let x, y;
            const windDx = this._leavesWindDx || 1;
            const windDy = this._leavesWindDy || 0;
            if (Math.abs(windDx) > Math.abs(windDy)) {
                if (windDx > 0) {
                    x = -24;
                    y = Math.random() * this.height;
                } else {
                    x = this.width + 24;
                    y = Math.random() * this.height;
                }
            } else {
                if (windDy > 0) {
                    x = Math.random() * this.width;
                    y = -24;
                } else {
                    x = Math.random() * this.width;
                    y = this.height + 24;
                }
            }
            const windAngle = Math.atan2(this._leavesWindDy, this._leavesWindDx);
            const windVar = 0.18 + Math.random() * 0.18;
            const windAngleVar = windAngle + (-0.18 + Math.random() * 0.36);
            this.particles.push({
                x,
                y,
                r: 8 + Math.random() * this.width / 200,
                alpha: 0.7 + Math.random() * 0.3,
                angle: Math.random() * Math.PI * 2,
                spin: -0.02 + Math.random() * 0.04,
                windDx: this._leavesWindDx + Math.cos(windAngleVar) * windVar,
                windDy: this._leavesWindDy + Math.sin(windAngleVar) * windVar,
                pathVar: Math.random() * 1000,
                fadeIn: 0,
                fadeInFrames: 16
            });
        }
        let leafTypes;
        if (this.type === 'greenLeaves') {
            leafTypes = [
                { shape: 'maple', color: () => `rgba(${40+Math.floor(Math.random()*40)},${120+Math.floor(Math.random()*60)},${40+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#185a1c', points: 6 },
                { shape: 'oak', color: () => `rgba(${60+Math.floor(Math.random()*40)},${140+Math.floor(Math.random()*60)},${60+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#1a4a1a' },
                { shape: 'elm', color: () => `rgba(${70+Math.floor(Math.random()*40)},${160+Math.floor(Math.random()*60)},${70+Math.floor(Math.random()*30)},0.88)`, edgeColor: '#185a1c' }
            ];
        } else {
            leafTypes = [
                { shape: 'maple', color: () => `rgba(${170+Math.floor(Math.random()*60)},${30+Math.floor(Math.random()*40)},${20+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#a02a1c', points: 5 + Math.floor(Math.random()*2) },
                { shape: 'maple', color: () => `rgba(${220+Math.floor(Math.random()*25)},${110+Math.floor(Math.random()*60)},${30+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#b93a1a', points: 7 },
                { shape: 'maple', color: () => `rgba(${230+Math.floor(Math.random()*20)},${180+Math.floor(Math.random()*40)},${40+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#b98c1a', points: 6 },
                { shape: 'maple', color: () => `rgba(${120+Math.floor(Math.random()*40)},${70+Math.floor(Math.random()*30)},${30+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#6e3b1a', points: 5 },
                { shape: 'maple', color: () => `rgba(${220+Math.floor(Math.random()*20)},${170+Math.floor(Math.random()*40)},${60+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#157901ff', points: 7 },
                { shape: 'maple', color: () => `rgba(${90+Math.floor(Math.random()*40)},${120+Math.floor(Math.random()*40)},${60+Math.floor(Math.random()*30)},0.82)`, edgeColor: '#4a5a1a', points: 6 },
                { shape: 'oak', color: () => `rgba(${120+Math.floor(Math.random()*40)},${80+Math.floor(Math.random()*30)},${40+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#6e3b1a' },
                { shape: 'oak', color: () => `rgba(${220+Math.floor(Math.random()*20)},${180+Math.floor(Math.random()*40)},${60+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#b98c1a' },
                { shape: 'oak', color: () => `rgba(${90+Math.floor(Math.random()*40)},${120+Math.floor(Math.random()*40)},${60+Math.floor(Math.random()*30)},0.82)`, edgeColor: '#4a5a1a' },
                { shape: 'elm', color: () => `rgba(${200+Math.floor(Math.random()*30)},${180+Math.floor(Math.random()*40)},${60+Math.floor(Math.random()*30)},0.88)`, edgeColor: '#b98c1a' },
                { shape: 'elm', color: () => `rgba(${120+Math.floor(Math.random()*40)},${90+Math.floor(Math.random()*30)},${50+Math.floor(Math.random()*30)},0.88)`, edgeColor: '#6e3b1a' }
            ];
        }
        for (let p of this.particles) {
            if (!p.leafShape) {
                const type = leafTypes[Math.floor(Math.random() * leafTypes.length)];
                p.leafShape = type.shape;
                p.edgeColor = type.edgeColor;
                p.color = typeof type.color === 'function' ? type.color() : type.color;
                if (type.lobes) p.lobes = type.lobes;
                if (type.points) p.points = type.points;
            }
            const pathVar = Math.sin(t * 0.7 + p.pathVar) * 1.5 + Math.cos(t * 0.5 + p.pathVar) * 1.5;
            p.angle += p.spin;
            p.x += p.windDx + pathVar * 0.08;
            p.y += p.windDy + Math.sin(t + p.pathVar) * 0.1;
            this.offscreenCtx.save();
            try {
                this.offscreenCtx.globalAlpha = p.alpha;
                this.offscreenCtx.translate(p.x, p.y);
                this.offscreenCtx.rotate(p.angle);
                this.offscreenCtx.beginPath();
                if (p.leafShape === 'oak') {
                    this.offscreenCtx.moveTo(0, -p.r * 0.9);
                    this.offscreenCtx.bezierCurveTo(p.r * 0.5, -p.r * 0.8, p.r * 0.7, -p.r * 0.2, p.r * 0.4, p.r * 0.1);
                    this.offscreenCtx.bezierCurveTo(p.r * 0.8, p.r * 0.4, p.r * 0.3, p.r * 0.8, 0, p.r * 0.6);
                    this.offscreenCtx.bezierCurveTo(-p.r * 0.3, p.r * 0.8, -p.r * 0.8, p.r * 0.4, -p.r * 0.4, p.r * 0.1);
                    this.offscreenCtx.bezierCurveTo(-p.r * 0.7, -p.r * 0.2, -p.r * 0.5, -p.r * 0.8, 0, -p.r * 0.9);
                    this.offscreenCtx.closePath();
                } else if (p.leafShape === 'maple') {
                    const r = p.r;
                    this.offscreenCtx.moveTo(0, -r);
                    this.offscreenCtx.bezierCurveTo(r * 0.2, -r * 0.7, r * 0.5, -r * 0.7, r * 0.5, -r * 0.3);
                    this.offscreenCtx.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.7, r * 0.2, r * 0.3, r * 0.2);
                    this.offscreenCtx.bezierCurveTo(r * 0.7, r * 0.5, r * 0.2, r * 0.7, 0, r * 0.5);
                    this.offscreenCtx.bezierCurveTo(-r * 0.2, r * 0.7, -r * 0.7, r * 0.5, -r * 0.3, r * 0.2);
                    this.offscreenCtx.bezierCurveTo(-r * 0.7, r * 0.2, -r * 0.9, -r * 0.2, -r * 0.5, -r * 0.3);
                    this.offscreenCtx.bezierCurveTo(-r * 0.5, -r * 0.7, -r * 0.2, -r * 0.7, 0, -r);
                    this.offscreenCtx.closePath();
                } else if (p.leafShape === 'elm') {
                    this.offscreenCtx.ellipse(0, p.r * 0.5, p.r * 0.6, p.r * 0.28, 0, 0, Math.PI * 2);
                }
                this.offscreenCtx.fillStyle = p.color;
                this.offscreenCtx.fill();
                if (p.edgeColor) {
                    this.offscreenCtx.strokeStyle = p.edgeColor;
                    this.offscreenCtx.lineWidth = 1.1;
                    this.offscreenCtx.stroke();
                }
            } finally {
                this.offscreenCtx.restore();
            }
        }
    }

    start() {
        if (!this.animationId) {
            this._animate();
            if (this.type === 'fog') {
                $(this.canvas).css({
                    filter: `blur(${window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.scale_factor}px`
                })
            }
            else if (this.type === 'faerieLight' || this.type === 'fireflies') {
                $(this.canvas).css({
                    filter: `blur(1px)`
                })
            }
            else {
                $(this.canvas).css({
                    filter: ``
                })
            }

            if (this.type === 'lightning') {
                $(this.lightCanvas).css({
                    filter: `blur(${window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.scale_factor}px`
                })
            }
            else{
                $(this.lightCanvas).css({
                    filter: ``
                })
            }
        }
    }

    
    stop(){
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.offscreenCtx.clearRect(0, 0, this.width, this.height);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.lightCtx.clearRect(0, 0, this.width, this.height);   
    }

    _animate = () => {
        const now = Date.now();
        if (!this._lastFrameTime) this._lastFrameTime = now;
        const elapsed = now - this._lastFrameTime;
        if (elapsed < 1000/60) {
            this.animationId = requestAnimationFrame(this._animate);
            return;
        }
        this._lastFrameTime = now;
        this.offscreenCtx.clearRect(0, 0, this.width, this.height);
        const typesWithLight = ['lightning'];
        if(typesWithLight.includes(this.type)){
            this.lightCtx.clearRect(0, 0, this.width, this.height);
        }

        if (this.type === 'rain') {
            this._drawRain();
        } else if (this.type === 'snow') {
            this._drawSnow();
        } else if (this.type === 'fog') {
            this._drawFog();
        } else if (this.type === 'embers') {
            this._drawEmbers();
        } else if (this.type === 'cherryBlossoms') {
            this._drawCherryBlossoms();
        } else if (this.type === 'lightning') {
            this._drawLightning();
        } else if (this.type === 'faerieLight') {
            this._drawFaerieLight();
        } else if (this.type === 'fireflies') {
            this._drawFireflies();
        } else if (this.type === 'leaves' || this.type === 'greenLeaves') {
            this._drawLeaves();
        }


            
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);


        
        this.animationId = requestAnimationFrame(this._animate);
    }

    _drawFaerieLight() {
        const t = Date.now() * 0.001;
        for (let p of this.particles) {
            const hue = (p.hue ?? 0) + t * 40;
            const color = `hsl(${hue % 360}, 90%, 70%)`;
            p.x += Math.sin(t * 0.7 + (p.phase ?? 0)) * 0.08 + (p.drift ?? 0) * 0.04;
            p.y += Math.cos(t * 0.5 + (p.phase ?? 0)) * 0.08;
            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = (p.alpha ?? 1);
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(p.x, p.y, p.r ?? 2, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = color;
            this.offscreenCtx.shadowColor = color;
            this.offscreenCtx.shadowBlur = 18;
            this.offscreenCtx.fill();
            this.offscreenCtx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = `rgba(255, 255, 255, 1)`;
            this.offscreenCtx.shadowBlur = 2;
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
        }
        this.particles = this.particles.filter(p =>
            p.x >= -20 && p.x <= this.width + 20 &&
            p.y >= -20 && p.y <= this.height + 20
        );
        while (this.particles.length < 23) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1 + Math.random() * 2,
                alpha: 0.7 + Math.random() * 0.3,
                hue: Math.random() * 360,
                drift: -0.5 + Math.random(),
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    _drawFireflies() {
        const t = Date.now() * 0.001;
        for (let p of this.particles) {
            const blink = 0.5 + 0.5 * Math.sin(t * p.blinkSpeed + p.blinkPhase);
            p.wanderAngle += (Math.random() - 0.5) * 0.1;
            p.x += Math.cos(p.wanderAngle) * p.wanderSpeed;
            p.y += Math.sin(p.wanderAngle) * p.wanderSpeed;
            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = p.alpha * blink;
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
            this.offscreenCtx.fillStyle = p.color;
            this.offscreenCtx.shadowColor = p.color;
            this.offscreenCtx.shadowBlur = 16;
            this.offscreenCtx.fill();
            this.offscreenCtx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = `rgba(255, 255, 255, 1)`;
            this.offscreenCtx.shadowBlur = 2;
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
        }
        this.particles = this.particles.filter(p =>
            p.x >= -20 && p.x <= this.width + 20 &&
            p.y >= -20 && p.y <= this.height + 20
        );
        while (this.particles.length < 28) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1 + Math.random() * 2,
                alpha: 0.7 + Math.random() * 0.3,
                blinkPhase: Math.random() * Math.PI * 2,
                blinkSpeed: 1.2 + Math.random() * 0.8,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderSpeed: 0.2 + Math.random() * 0.2,
                color: Math.random() > 0.5 ? 'rgba(200,255,120,1)' : 'rgba(255,255,180,1)'
            });
        }
    }

    _drawEmbers() {
        for (let p of this.particles) {
            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = p.alpha * (1 - p.life / p.maxLife);
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
            this.offscreenCtx.fillStyle = p.color;
            this.offscreenCtx.shadowColor = p.color;
            this.offscreenCtx.shadowBlur = 16;
            this.offscreenCtx.fill();
            this.offscreenCtx.arc(p.x, p.y, 0.5, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = `rgba(255, 255, 255, 1)`;
            this.offscreenCtx.shadowBlur = 2;
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
            p.x += p.windDx + (Math.random() - 0.5) * 0.2;
            p.y += p.windDy + (Math.random() - 0.5) * 0.2;
            p.life++;
        }
        this.particles = this.particles.filter(p =>
            p.x >= -20 && p.x <= this.width + 20 &&
            p.y >= -20 && p.y <= this.height + 20 &&
            p.life <= p.maxLife
        );
        while (this.particles.length < 40) {
            let baseX = Math.random() * (this.width + 40) - 20;
            let baseY = Math.random() * (this.height + 40) - 20;
            this.particles.push({
                x: baseX,
                y: baseY,
                r: 0.5 + Math.random() * 1,
                alpha: 0.7 + Math.random() * 0.3,
                speed: 0.3 + Math.random() * 0.3,
                drift: -0.2 + Math.random() * 0.4,
                windDx: this._windDx,
                windDy: this._windDy,
                life: 0,
                maxLife: 120 + Math.random() * 60,
                color: Math.random() > 0.5 ? 'rgba(255,180,60,1)' : 'rgba(255,100,0,1)'
            });
        }
    }

    _drawCherryBlossoms() {
        const t = Date.now() * 0.001;
        for (let p of this.particles) {
            if (p.type === 'petal') {
                const pathVar = Math.sin(t * 0.9 + p.pathVar) * 1.8 + Math.cos(t * 0.7 + p.pathVar) * 1.2;
                p.angle += p.spin * 0.7;
                p.x += p.windDx + pathVar * 0.07;
                p.y += p.windDy + Math.sin(t + p.pathVar) * 0.13 + p.speed;
                this.offscreenCtx.save();
                this.offscreenCtx.globalAlpha = p.alpha;
                this.offscreenCtx.translate(p.x, p.y);
                this.offscreenCtx.rotate(p.angle);
                this.offscreenCtx.beginPath();
                this.offscreenCtx.moveTo(0, 0);
                this.offscreenCtx.quadraticCurveTo(p.r * 0.5, -p.r * 0.7, 0, -p.r);
                this.offscreenCtx.quadraticCurveTo(-p.r * 0.5, -p.r * 0.7, 0, 0);
                this.offscreenCtx.closePath();
                this.offscreenCtx.fillStyle = p.color;
                this.offscreenCtx.shadowColor = p.color;
                this.offscreenCtx.shadowBlur = 4;
                this.offscreenCtx.fill();
                this.offscreenCtx.restore();
            }
        }
        for (let p of this.particles) {
            if (p.type !== 'blossom') continue;
            const pathVar = Math.sin(t * 0.7 + p.pathVar) * 1.5 + Math.cos(t * 0.5 + p.pathVar) * 1.5;
            p.angle += p.spin;
            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = p.alpha;
            this.offscreenCtx.translate(p.x, p.y);
            this.offscreenCtx.rotate(p.angle);
            for (let petal = 0; petal < 5; petal++) {
                this.offscreenCtx.save();
                const petalAngle = (Math.PI * 2 / 5) * petal + (Math.random() - 0.5) * 0.10;
                this.offscreenCtx.rotate(petalAngle);
                this.offscreenCtx.beginPath();
                this.offscreenCtx.moveTo(0, 0);
                this.offscreenCtx.bezierCurveTo(
                    p.r * 0.28, -p.r * 0.18,
                    p.r * 0.38, -p.r * 0.55,
                    0, -p.r * 0.62
                );
                this.offscreenCtx.bezierCurveTo(
                    -p.r * 0.38, -p.r * 0.55,
                    -p.r * 0.28, -p.r * 0.18,
                    0, 0
                );
                let grad = this.offscreenCtx.createLinearGradient(0, 0, 0, -p.r);
                grad.addColorStop(0, p.petalColor);
                grad.addColorStop(0.7, p.tipColor);
                grad.addColorStop(1, 'rgba(255,255,255,0.13)');
                this.offscreenCtx.fillStyle = grad;
                this.offscreenCtx.shadowColor = p.tipColor;
                this.offscreenCtx.shadowBlur = 7;
                this.offscreenCtx.fill();
                this.offscreenCtx.restore();
            }
            this.offscreenCtx.save();
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(0, 0, p.r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
            this.offscreenCtx.lineWidth = p.r * 0.09;
            this.offscreenCtx.strokeStyle = 'rgba(255,255,255,0.18)';
            this.offscreenCtx.shadowColor = 'rgba(255,255,255,0.18)';
            this.offscreenCtx.shadowBlur = 2;
            this.offscreenCtx.stroke();
            this.offscreenCtx.restore();
            this.offscreenCtx.beginPath();
            this.offscreenCtx.arc(0, 0, p.r * 0.18, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = p.centerColor;
            this.offscreenCtx.shadowColor = p.centerColor;
            this.offscreenCtx.shadowBlur = 2;
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
            p.x += p.windDx + pathVar * 0.03;
            p.y += p.windDy + pathVar * 0.03;
            p.y += p.speed;
        }
        this.particles = this.particles.filter(p =>
            p.x >= -20 && p.x <= this.width + 20 &&
            p.y >= -20 && p.y <= this.height + 20
        );
        while (this.particles.length < 40) {
            let baseX = Math.random() * (this.width + 40) - 20;
            let baseY = Math.random() * (this.height + 40) - 20;
            this.particles.push({
                type: 'blossom',
                x: baseX,
                y: baseY,
                r: 6 + Math.random() * 4,
                alpha: 0.7 + Math.random() * 0.3,
                drift: -0.5 + Math.random(),
                speed: 0.2 + Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2,
                angle: Math.random() * Math.PI * 2,
                spin: -0.03 + Math.random() * 0.06,
                windDx: this._windDx,
                windDy: this._windDy,
                pathVar: Math.random() * 1000,
                petalColor: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.85)`,
                tipColor: `rgba(255,${120+Math.floor(Math.random()*60)},${200+Math.floor(Math.random()*40)},0.95)`,
                centerColor: 'rgba(255,220,230,0.7)'
            });
            this.particles.push({
                type: 'petal',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 2.5 + Math.random() * 2.5,
                alpha: 0.5 + Math.random() * 0.4,
                drift: -0.7 + Math.random() * 1.4,
                speed: 0.12 + Math.random() * 0.13,
                phase: Math.random() * Math.PI * 2,
                angle: Math.random() * Math.PI * 2,
                spin: -0.04 + Math.random() * 0.08,
                windDx: this._windDx * 1.1,
                windDy: this._windDy * 1.1,
                pathVar: Math.random() * 1000,
                color: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.82)`
            });
        }
    }

    _drawLightning() {
        const t = Date.now() * 0.002;
        if (!this._lightningTimer || this._lightningTimer <= 0) {
            this._lightningAlpha = 0.18 + Math.random() * 0.10;
            this._lightningTimer = 360 + Math.floor(Math.random() * 360);
            this._lightningFlashFrames = 10 + Math.floor(Math.random() * 8);
            const angle = Math.random() * Math.PI * 2;
            const length = this.width * (0.7 + Math.random() * 0.5);
            const centerDist = this.width * (0.3 + Math.random() * 0.5);
            this._lightningStrike = {
                x: this.width / 2 + Math.cos(angle) * centerDist,
                y: this.height / 2 + Math.sin(angle) * centerDist,
                angle,
                length
            };
        }
        if (this._lightningFlashFrames && this._lightningFlashFrames > 0 && this._lightningStrike) {
            const glowAlpha = this._lightningAlpha * 0.7;
            const glowRadiusX = this.width * (0.45 + Math.random() * 0.25);
            const glowRadiusY = this.height * (0.28 + Math.random() * 0.18);
            
            this.lightCtx.save();
            this.lightCtx.globalAlpha = 0.5;
            this.lightCtx.beginPath();
            this.lightCtx.ellipse(
                this._lightningStrike.x + Math.cos(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                this._lightningStrike.y + Math.sin(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                glowRadiusX,
                glowRadiusY,
                this._lightningStrike.angle,
                0,
                Math.PI * 2
            );
            this.lightCtx.fillStyle = 'rgba(255,255,255,0.22)';
            this.lightCtx.shadowColor = '#fff';
            this.lightCtx.shadowBlur = 120;
            this.lightCtx.fill();
            this.lightCtx.restore();


            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = glowAlpha;
            this.offscreenCtx.beginPath();
            this.offscreenCtx.ellipse(
                this._lightningStrike.x + Math.cos(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                this._lightningStrike.y + Math.sin(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                glowRadiusX,
                glowRadiusY,
                this._lightningStrike.angle,
                0,
                Math.PI * 2
            );
            this.offscreenCtx.fillStyle = 'rgba(255,255,255,0.22)';
            this.offscreenCtx.shadowColor = '#fff';
            this.offscreenCtx.shadowBlur = 120;
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
            this.offscreenCtx.globalAlpha = this._lightningAlpha * 0.7;
            this.offscreenCtx.save();
            this.offscreenCtx.translate(this._lightningStrike.x, this._lightningStrike.y);
            this.offscreenCtx.rotate(this._lightningStrike.angle);
            this.offscreenCtx.beginPath();
            this.offscreenCtx.moveTo(0, 0);
            this.offscreenCtx.lineTo(this._lightningStrike.length, 0);
            this.offscreenCtx.strokeStyle = 'rgba(255,255,255,0.7)';
            this.offscreenCtx.lineWidth = 7 + Math.random() * 4;
            this.offscreenCtx.shadowColor = '#fff';
            this.offscreenCtx.shadowBlur = 32 + Math.random() * 24;
            this.offscreenCtx.stroke();
            this.offscreenCtx.restore();
            this._lightningAlpha -= 0.012;
            this._lightningFlashFrames--;
            this.offscreenCtx.restore();
        } else {
            this._lightningAlpha = 0;
        }
        this._lightningTimer--;
        this._drawRain();
    }

    _drawRain() {
        const t = Date.now() * 0.001;
        for (let p of this.particles) {
            if (p.splash && p.start == true) {
                this.offscreenCtx.save();
                let fade = 1;
                if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 10)) {
                    fade = p.fadeIn / (p.fadeInFrames || 10);
                    p.fadeIn++;
                }
                const progress = p.life / p.maxLife;
                this.offscreenCtx.globalAlpha = 0.4 * (1 - progress) * fade;
                this.offscreenCtx.beginPath();
                this.offscreenCtx.arc(p.x, p.y, p.r * (1 + progress * 1.5), 0, Math.PI * 2);
                this.offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
                this.offscreenCtx.lineWidth = 1.2 + 1.5 * (1 - progress);
                this.offscreenCtx.shadowColor = '#00aeff80';
                this.offscreenCtx.shadowBlur = 8;
                this.offscreenCtx.stroke();
                this.offscreenCtx.restore();
                p.life++;
                if (p.life > p.maxLife) {
                    const droplet = this.particles.find(d => !d.splash && d.id === p.dropletId);
                    if (droplet) {
                        p.x = droplet.groundX;
                        p.y = droplet.groundY;
                        p.life = 0;
                        p.maxLife = 18 + Math.random() * 10;
                        p.fadeIn = 0;
                    }
                    p.start = false;
                }
            } else {
                let fade = 1;
                if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 10)) {
                    fade = p.fadeIn / (p.fadeInFrames || 10);
                    p.fadeIn++;
                }
                p.z += 0.012 + 0.022 * Math.random();
                if (p.z > 1) p.z = 1;
                const windOffset = p.wind * 0.08 * p.z;
                p.x = (1 - p.z) * p.startX + p.z * p.groundX + windOffset;
                p.y = (1 - p.z) * p.startY + p.z * p.groundY;
                const streakLen = 18 + 22 * (1 - p.z);
                this.offscreenCtx.save();
                this.offscreenCtx.globalAlpha = 0.2 + (2 * (1 - p.z) * fade*.8);
                this.offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                this.offscreenCtx.lineWidth = 1.4 + 1.7 * (1 - p.z);
                this.offscreenCtx.beginPath();
                this.offscreenCtx.moveTo(p.x, p.y);
                this.offscreenCtx.lineTo(p.x, p.y + streakLen);
                this.offscreenCtx.shadowColor = '#00aeff80';
                this.offscreenCtx.shadowBlur = 10 * (1 - p.z);
                this.offscreenCtx.stroke();
                this.offscreenCtx.restore();
                if (p.z>=1) {
                    const splash = this.particles.find(s => s.splash && s.dropletId === p.id);
                    if (splash) {
                        splash.x = p.groundX;
                        splash.y = p.groundY;
                        splash.life = 0;
                        splash.maxLife = 18 + Math.random() * 10;
                        splash.fadeIn = 0;
                        splash.start = true;
                    }
                    const groundX = Math.random() * this.width;
                    const groundY = Math.random() * this.height;
                    p.startX = groundX;
                    p.startY = groundY - this.height * 0.5 - Math.random() * this.height * 0.5;
                    p.groundX = groundX;
                    p.groundY = groundY;
                    p.z = 0;
                    p.wind = -0.7 + Math.random() * 1.4;
                    p.fadeIn = 0;
                }
            }
        }
    }

    _drawSnow() {
        const t = Date.now() * 0.001;
        for (let p of this.particles) {
            let fade = 1;
            if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 16)) {
                fade = p.fadeIn / (p.fadeInFrames || 16);
                p.fadeIn++;
            }
            p.z += p.speed;
            if (p.z > 1) p.z = 1;
            p.drift += (-0.003 + 0.006 * Math.random());
            const windOffset = ((Math.sin(t * 0.7 + p.phase) * (p.drift ?? 0.5) * 1.2) + p.wind * 0.16) * p.z;
            p.angle += p.spin;
            p.x = (1 - p.z) * p.startX + p.z * p.groundX + windOffset;
            p.y = (1 - p.z) * p.startY + p.z * p.groundY;
            this.offscreenCtx.save();
            this.offscreenCtx.globalAlpha = (p.alpha ?? 1) * fade * (1 - p.z + 0.2);
            this.offscreenCtx.translate(p.x, p.y);
            this.offscreenCtx.rotate(p.angle + Math.sin(t * 0.7 + p.phase) * 0.7);
            const grad = this.offscreenCtx.createRadialGradient(0, 0, 0, 0, 0, p.r * (1 - p.z + 0.2));
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.7, 'rgba(220,240,255,0.7)');
            grad.addColorStop(1, 'rgba(200,220,255,0.1)');
            this.offscreenCtx.fillStyle = grad;
            this.offscreenCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                const theta = (Math.PI * 2 / 6) * i;
                this.offscreenCtx.lineTo(Math.cos(theta) * p.r * (1 - p.z + 0.2), Math.sin(theta) * p.r * (1 - p.z + 0.2));
            }
            this.offscreenCtx.closePath();
            this.offscreenCtx.fill();
            this.offscreenCtx.restore();
            if (p.z >= 1) {
                const groundX = Math.random() * this.width;
                const groundY = Math.random() * this.height;
                p.startX = groundX;
                p.startY = groundY - this.height * 0.5 - Math.random() * this.height * 0.5;
                p.groundX = groundX;
                p.groundY = groundY;
                p.z = 0;
                p.r = 3 + Math.random() * 5;
                p.alpha = 0.7 + Math.random() * 0.3;
                p.drift = 1 + Math.random() * 100;
                p.speed = 0.0001 + Math.random() * 0.0002; 
                p.phase = Math.random() * Math.PI * 2;
                p.angle = Math.random() * Math.PI * 2;
                p.spin = -0.01 + Math.random() * 0.02;
                p.wind = 0.001 + Math.random() * 0.025;
                p.fadeIn = 1;
            }
        }
    }

    _drawFog() {
        const t = Date.now() * 0.00018;
        for (let p of this.particles) {
            const cx = p.x + Math.sin(t * 0.7 + p.phase) * 18;
            const cy = p.y + Math.cos(t * 0.5 + p.phase) * 12;
            const baseR = p.r;
            const baseAspect = p.aspect;
            const fogColor = `rgba(120, 120, 120, ${(p.alpha * 1.2 + 0.22).toFixed(3)}`;
            let fade = 1;
            if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 10)) {
                fade = p.fadeIn / (p.fadeInFrames || 10);
                p.fadeIn++;
            }
            this.offscreenCtx.globalAlpha =(p.alpha * 1.2 + 0.22) * fade;
            this.offscreenCtx.shadowColor = fogColor;
            this.offscreenCtx.shadowBlur = 1;
            this.offscreenCtx.beginPath();
            this.offscreenCtx.ellipse(cx, cy, baseR * (1.1 + 0.2 * Math.sin(t * 0.9 + p.phase)), baseR * baseAspect * (0.8 + 0.2 * Math.cos(t * 0.8 + p.phase)), 0, 0, Math.PI * 2);
            this.offscreenCtx.fillStyle = fogColor;
            this.offscreenCtx.fill();
            for (let j = 0; j < 3; j++) {
                const angle = p.phase + j * 2.1;
                const dist = baseR * (0.32 + 0.18 * Math.sin(t * 0.6 + p.phase + j));
                const subCx = cx + Math.cos(angle) * dist;
                const subCy = cy + Math.sin(angle) * dist;
                const subR = baseR * (0.62 + 0.18 * Math.cos(t * 0.5 + p.phase + j));
                const subAspect = baseAspect * (0.8 + 0.25 * Math.sin(t * 0.7 + p.phase + j));
                this.offscreenCtx.beginPath();
                this.offscreenCtx.ellipse(subCx, subCy, subR * (1 * (j + 1) + 0.18 * Math.sin(t * 0.9 + p.phase + j)), subR * subAspect * (0.7 * (j + 1) + 0.2 * Math.cos(t * 0.8 + p.phase + j)), 0, 0, Math.PI * 2);
                this.offscreenCtx.fillStyle = fogColor;
                this.offscreenCtx.globalAlpha = (p.alpha * 0.7 + 0.13) * (0.8 - 0.15 * j) * fade;
                this.offscreenCtx.fill();
            }
            p.x += this._windDx * (0.7 + 0.6 * (p.r / 56));
            p.y += this._windDy * (0.7 + 0.6 * (p.r / 56));
            if (p.x < -p.r || p.x > this.width + p.r || p.y < -p.r || p.y > this.height + p.r) {
                p.x = Math.random() * (this.width + 200) - 100;
                p.y = Math.random() * (this.height + 200) - 100;
                p.phase = Math.random() * Math.PI * 2;
                p.fadeIn = 1;
                p.r = 200 + Math.random() * this.width / 100;
            }
        }
    }
}

function set_weather(){
    const currentWeather = window.CURRENT_SCENE_DATA.weather || 'none';
    if(window.WeatherOverlay == undefined){
        const weatherCanvas = $('#weather_overlay');
        const weatherLightCanvas = $('#weather_light');
        window.WeatherOverlay = new WeatherOverlay(weatherCanvas[0], weatherLightCanvas[0], currentWeather);
    }

    if(!currentWeather || currentWeather == 'none' || currentWeather == '0'){
        window.WeatherOverlay.stop();
        window.WeatherOverlay.ctx.clearRect(0, 0, window.WeatherOverlay.width, window.WeatherOverlay.height);
        return;
    }
         
    window.WeatherOverlay.stop();
    window.WeatherOverlay.setType(window.CURRENT_SCENE_DATA.weather);
    window.WeatherOverlay.start();
}

function getWeatherTypes() {
    return {
        'rain': 'Rain',
        'snow': 'Snow',
        'fog': 'Fog',
        'embers': 'Embers',
        'cherryBlossoms': 'Cherry Blossoms',
        'lightning': 'Lightning',
        'faerieLight': 'Faerie Light',
        'fireflies': 'Fireflies',
        'leaves': 'Fall Leaves',
        'greenLeaves': 'Green Leaves'
    };
}