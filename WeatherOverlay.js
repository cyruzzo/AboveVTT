class WeatherOverlay {
    constructor(canvas, lightCanvas, type = 'rain', intensity = 120) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');          
        this.lightCanvas = lightCanvas;
        this.lightCtx = lightCanvas.getContext('2d');  
        this.particles = [];
        this.animationId = null;
        this.width = canvas.width;
        this.height = canvas.height;
        this._particleIndex = new Map();
        this.setType(type, intensity);
    }
    
    resizeCtx(current, canvas, nonzero) {
        if(nonzero) {
            if(canvas.width != this.width || canvas.height != this.height) {
                canvas.width = this.width;
                canvas.height = this.height;
            } else {
                current.clearRect(0, 0, this.width, this.height);
            }
        } else {
            current.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.height = 0;
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        this.particles.length = 0;
        this._particleIndex.clear();
        this.canvas = null;
        this.ctx = null;
        this.lightCanvas = null;
        this.lightCtx = null;
        delete window.WeatherOverlay;
    }
    
    setType(type, intensity) {
        this.stop();
        this.type = type;
        const weatherData = getWeatherTypes()[this.type];
        this.intensity = intensity || weatherData?.default || 120;
        
        const weatherExists = (this.type && this.type != '0' && this.type != 'none' && this.intensity != 0);
        this.resizeCtx(this.ctx, this.canvas, weatherExists);
        this.resizeCtx(this.lightCtx, this.lightCanvas, weatherExists && weatherData?.lit);
        
        if(weatherExists) {
            this._initParticles();
            this._animate();
            
            if (this.type === 'fog') {
                $(this.canvas).css({
                    filter: `blur(${ window.CURRENT_SCENE_DATA.hpps }px`
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
            
            if (weatherData?.lit) {
                $(this.lightCanvas).css({
                    filter: `blur(${window.CURRENT_SCENE_DATA.hpps / window.CURRENT_SCENE_DATA.scale_factor}px`
                })
            }
            else{
                $(this.lightCanvas).css({
                    filter: ``
                })
            }
        }else{
            this.destroy();
        }
    }
    
    setIntensity(intensity) {
        this.intensity = intensity;
        this._initParticles();
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;
        this._initParticles();
    }

    _initParticles() {
        this.particles = [];
        this._particleIndex.clear();
        const count = this.intensity !== undefined ? this.intensity : 120;
        const weatherTypes = getWeatherTypes();
        const data = weatherTypes[this.type];
        
        if (data != undefined){
            const defaultIntensity = data.default;
            const intensityMultiplier = this.intensity > defaultIntensity
                ? 1 + Math.pow((this.intensity - defaultIntensity) / defaultIntensity, 1.5) * 3
                : 1;
            this.intensityMultiplier = intensityMultiplier;
            const maxIntensity = data.max;
            const angleMultiplier = Math.max(0, Math.min(1, (this.intensity - defaultIntensity) / (maxIntensity - defaultIntensity)));
            const maxAngleDegrees = 25;
            this.angleRadians = (angleMultiplier * maxAngleDegrees) * (Math.PI / 180);
            this.horizontalOffset = Math.tan(this.angleRadians) * this.height;
        }

        if (this.type === 'fog' || this.type === 'embers' || this.type === 'cherryBlossoms') {
            const angle = Math.random() * Math.PI * 2;
            this._windAngle = angle;
            this._windSpeed = 0.08 + Math.random() * 0.1;
            this._windDx = Math.cos(angle) * this._windSpeed;
            this._windDy = Math.sin(angle) * this._windSpeed;
        }

        const fadeInFrames = 60;

        if (this.type === 'rain' || this.type === 'lightning') {
            const startIdx = this.particles.length;
            for (let i = 0; i < count; i++) {
                const id = i + '_' + Math.floor(Math.random() * 1000000);
                const endX = Math.random() * this.width;
                const endY = Math.random() * this.height;
                const startX = endX - this.horizontalOffset;
                const startY = endY - this.height * (0.5 + Math.random() * 0.5);
                const wind = -0.7 + Math.random() * 1.4;
                const z = Math.random();
                const dropletIdx = startIdx + (i * 2);
                const splashIdx = startIdx + (i * 2) + 1;
                this._particleIndex.set(id, dropletIdx);
                this._particleIndex.set('splash_' + id, splashIdx);
                this.particles.push({
                    id, startX, startY, groundX: endX, groundY: endY,
                    wind, z: z, fadeIn: Math.ceil(fadeInFrames * z),
                    fadeInFrames, splash: false, splashed: false
                });
                this.particles.push({
                    dropletId: id, splash: true, x: endX, y: endY,
                    r: 3 + Math.random() * 2, life: 0, maxLife: 18 + Math.random() * 10,
                    fadeIn: 0, fadeInFrames: 10
                });
            }
        } else if (this.type === 'leaves' || this.type === 'greenLeaves') {
            const windAngle = Math.random() * Math.PI * 2;
            const windSpeed = 0.18 + Math.random() * 0.12;
            this._leavesWindDx = Math.cos(windAngle) * windSpeed;
            this._leavesWindDy = Math.sin(windAngle) * windSpeed;
            

            if (this.type === 'greenLeaves') {
                this._leafTypes = [
                    { shape: 'maple', color: `rgba(${40+Math.floor(Math.random()*40)},${120+Math.floor(Math.random()*60)},${40+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#185a1c'},
                    { shape: 'maple', color: `rgba(${40 + Math.floor(Math.random() * 40)},${120 + Math.floor(Math.random() * 60)},${40 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#185a1c'},
                    { shape: 'maple', color: `rgba(${40 + Math.floor(Math.random() * 40)},${120 + Math.floor(Math.random() * 60)},${40 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#185a1c'},
                    { shape: 'oak', color: `rgba(${60+Math.floor(Math.random()*40)},${140+Math.floor(Math.random()*60)},${60+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#1a4a1a' },
                    { shape: 'elm', color: `rgba(${70+Math.floor(Math.random()*40)},${160+Math.floor(Math.random()*60)},${70+Math.floor(Math.random()*30)},0.88)`, edgeColor: '#185a1c' }
                ];
            } else {
                this._leafTypes = [
                    { shape: 'maple', color: `rgba(${170+Math.floor(Math.random()*60)},${30+Math.floor(Math.random()*40)},${20+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#a02a1c'},
                    { shape: 'maple', color: `rgba(${220+Math.floor(Math.random()*25)},${110+Math.floor(Math.random()*60)},${30+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#b93a1a'},
                    { shape: 'maple', color: `rgba(${230+Math.floor(Math.random()*20)},${180+Math.floor(Math.random()*40)},${40+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#b98c1a'},
                    { shape: 'maple', color: `rgba(${170 + Math.floor(Math.random() * 20)},${220 + Math.floor(Math.random() * 35)},${60+Math.floor(Math.random()*30)},0.92)`, edgeColor: '#157901ff'},
                    { shape: 'maple', color: `rgba(${170 + Math.floor(Math.random() * 20)},${220 + Math.floor(Math.random() * 35)},${60 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#157901ff'},
                    { shape: 'maple', color: `rgba(${220 + Math.floor(Math.random() * 25)},${110 + Math.floor(Math.random() * 60)},${30 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b93a1a'},
                    { shape: 'maple', color: `rgba(${230 + Math.floor(Math.random() * 20)},${180 + Math.floor(Math.random() * 40)},${40 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b98c1a'},
                    { shape: 'oak', color: `rgba(${170 + Math.floor(Math.random() * 60)},${30 + Math.floor(Math.random() * 40)},${20 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#a02a1c'},
                    { shape: 'oak', color: `rgba(${220 + Math.floor(Math.random() * 25)},${110 + Math.floor(Math.random() * 60)},${30 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b93a1a'},
                    { shape: 'oak', color: `rgba(${230 + Math.floor(Math.random() * 20)},${180 + Math.floor(Math.random() * 40)},${40 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b98c1a'},
                    { shape: 'oak', color: `rgba(${170 + Math.floor(Math.random() * 20)},${220 + Math.floor(Math.random() * 35)},${60 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#157901ff'},
                    { shape: 'elm', color: `rgba(${170 + Math.floor(Math.random() * 60)},${30 + Math.floor(Math.random() * 40)},${20 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#a02a1c'},
                    { shape: 'elm', color: `rgba(${220 + Math.floor(Math.random() * 25)},${110 + Math.floor(Math.random() * 60)},${30 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b93a1a'},
                    { shape: 'elm', color: `rgba(${230 + Math.floor(Math.random() * 20)},${180 + Math.floor(Math.random() * 40)},${40 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#b98c1a'},
                    { shape: 'elm', color: `rgba(${170 + Math.floor(Math.random() * 20)},${220 + Math.floor(Math.random() * 35)},${60 + Math.floor(Math.random() * 30)},0.92)`, edgeColor: '#157901ff'},
                ];
            }

            for (let i = 0; i < count; i++) {
                const windVar = 0.06 + Math.random() * 0.08;
                const windAngleVar = windAngle + (-0.18 + Math.random() * 0.36);
                const r = 4 + Math.random() * this.width/500;
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    r,
                    alpha: 1,
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
                const groundY = (1 + Math.random() * 0.25) * this.height;
                const startY = Math.random() * 1.25 * this.height;
                const ratio = startY / groundY;
                this.particles.push({
                    startX: groundX, startY: startY, groundX: groundX, groundY: groundY,
                    z: ratio, r: 2 + Math.random() * 4, alpha: 0.8 + Math.random() * 0.2,
                    drift: 1 + Math.random() * 100 * this.intensityMultiplier, 
                    speed: (0.0001 + Math.random() * 0.0002) * this.intensityMultiplier, 
                    phase: Math.random() * Math.PI * 2,
                    angle: Math.random() * Math.PI * 2 * this.intensityMultiplier,
                    spin: -0.01 + Math.random() * 0.02 * this.intensityMultiplier,
                    wind: 0.001 + Math.random() * 0.025 * this.intensityMultiplier * this.intensityMultiplier,
                    fadeIn: 0, fadeInFrames: fadeInFrames,
                    gradient: null
                });
            }
        } else if (this.type === 'fog') {
            for (let i = 0; i < count; i++) {
                const baseR = 200 + Math.random() * this.width/100;
                const aspect = 0.6 + Math.random() * 0.8;
                this.particles.push({
                    x: Math.random() * (this.width + 200) - 100,
                    y: Math.random() * (this.height + 120) - 60,
                    r: baseR, aspect: aspect, alpha: 0.1 + Math.random() * 0.05,
                    phase: Math.random() * Math.PI * 2, fadeIn: 0, fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'embers') {
            for (let i = 0; i < count; i++) {
                let baseX = Math.random() * (this.width + 40) - 20;
                let baseY = Math.random() * (this.height + 40) - 20;
                this.particles.push({
                    x: baseX, y: baseY, r: 1 + Math.random() * 1, alpha: 0.7 + Math.random() * 0.3,
                    speed: 0.3 + Math.random() * 0.3, drift: -0.2 + Math.random() * 0.4,
                    windDx: this._windDx, windDy: this._windDy, life: 0,
                    maxLife: 120 + Math.random() * 60,
                    color: Math.random() > 0.5 ? 'rgba(255,180,60,1)' : 'rgba(255,100,0,1)',
                    fadeIn: 0, fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'cherryBlossoms') {
            for (let i = 0; i < count; i++) {
                let baseX = Math.random() * (this.width + 40) - 20;
                let baseY = Math.random() * (this.height + 40) - 20;
                this.particles.push({
                    type: 'blossom', x: baseX, y: baseY, r: 6 + Math.random() * 4,
                    alpha: 0.7 + Math.random() * 0.3, drift: -0.5 + Math.random(),
                    speed: 0.2 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2,
                    angle: Math.random() * Math.PI * 2, spin: -0.03 + Math.random() * 0.06,
                    windDx: this._windDx, windDy: this._windDy, pathVar: Math.random() * 1000,
                    petalColor: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.85)`,
                    tipColor: `rgba(255,${120+Math.floor(Math.random()*60)},${200+Math.floor(Math.random()*40)},0.95)`,
                    centerColor: 'rgba(255,220,230,0.7)',
                    fadeIn: 0, fadeInFrames: fadeInFrames,
                    gradient: null
                });
                this.particles.push({
                    type: 'petal', x: Math.random() * this.width, y: Math.random() * this.height,
                    r: 2.5 + Math.random() * 2.5, alpha: 0.5 + Math.random() * 0.4,
                    drift: -0.7 + Math.random() * 1.4, speed: 0.12 + Math.random() * 0.13,
                    phase: Math.random() * Math.PI * 2, angle: Math.random() * Math.PI * 2,
                    spin: -0.04 + Math.random() * 0.08, windDx: this._windDx * 1.1,
                    windDy: this._windDy * 1.1, pathVar: Math.random() * 1000,
                    color: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.82)`,
                    fadeIn: 0, fadeInFrames: fadeInFrames
                });
            }
        } else if (this.type === 'faerieLight' ||  this.type === 'fireflies') {
            for (let i = 0; i < count; i++) {
                const r = 1 + Math.random() * 2;
                this.particles.push({
                    x: Math.random() * this.width, y: Math.random() * this.height,
                    r: r, baseR: r, alpha: 0.7 + Math.random() * 0.3, hue: Math.random() * 360,
                    speed: 0.1 + Math.random() * 0.15, angle: Math.random() * Math.PI * 2,
                    drift: -0.5 + Math.random(), phase: Math.random() * Math.PI * 2,
                    fadeIn: 0, fadeInFrames: fadeInFrames, blinkPhase: Math.random() * Math.PI * 2,
                    blinkSpeed: 1.2 + Math.random() * 0.8, wanderAngle: Math.random() * Math.PI * 2,
                    wanderSpeed: 0.2 + Math.random() * 0.2,
                    color: Math.random() > 0.5 ? 'rgba(200,255,120,1)' : 'rgba(255,255,180,1)'
                });
            }
        }
    }

    _drawLeaves() {
        const t = Date.now() * 0.001;
        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            if (p.x >= -32 && p.x <= this.width + 32 &&
                p.y >= -32 && p.y <= this.height + 32) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
        
        while (this.particles.length < this.intensity) {
            let x, y;
            const windDx = this._leavesWindDx || 1;
            const windDy = this._leavesWindDy || 0;
            if (Math.abs(windDx) > Math.abs(windDy)) {
                if (windDx > 0) {
                    x = -24; y = Math.random() * this.height;
                } else {
                    x = this.width + 24; y = Math.random() * this.height;
                }
            } else {
                if (windDy > 0) {
                    x = Math.random() * this.width; y = -24;
                } else {
                    x = Math.random() * this.width; y = this.height + 24;
                }
            }
            const windAngle = Math.atan2(this._leavesWindDy, this._leavesWindDx);
            const windVar = 0.18 + Math.random() * 0.18;
            const windAngleVar = windAngle + (-0.18 + Math.random() * 0.36);
            this.particles.push({
                x, y, r: 4 + Math.random() * this.width / 500, alpha: 1,
                angle: Math.random() * Math.PI * 2, spin: -0.02 + Math.random() * 0.04,
                windDx: this._leavesWindDx + Math.cos(windAngleVar) * windVar,
                windDy: this._leavesWindDy + Math.sin(windAngleVar) * windVar,
                pathVar: Math.random() * 1000, fadeIn: 0, fadeInFrames: 16
            });
        }
        
        for (let p of this.particles) {
            if (!p.leafShape) {
                const type = this._leafTypes[Math.floor(Math.random() * this._leafTypes.length)];
                p.leafShape = type.shape;
                p.edgeColor = type.edgeColor;
                p.color = type.color;
            }
            const pathVar = Math.sin(t * 0.7 + p.pathVar) * 1.5 + Math.cos(t * 0.5 + p.pathVar) * 1.5;
            p.angle += p.spin;
            p.x += p.windDx + pathVar * 0.08;
            p.y += p.windDy + Math.sin(t + p.pathVar) * 0.1;
            this.ctx.save();
            try {
                this.ctx.globalAlpha = p.alpha;
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                this.ctx.beginPath();
                if (p.leafShape === 'oak') {
                    this.ctx.moveTo(0, -p.r * 0.9);
                    this.ctx.bezierCurveTo(p.r * 0.5, -p.r * 0.8, p.r * 0.7, -p.r * 0.2, p.r * 0.4, p.r * 0.1);
                    this.ctx.bezierCurveTo(p.r * 0.8, p.r * 0.4, p.r * 0.3, p.r * 0.8, 0, p.r * 0.6);
                    this.ctx.bezierCurveTo(-p.r * 0.3, p.r * 0.8, -p.r * 0.8, p.r * 0.4, -p.r * 0.4, p.r * 0.1);
                    this.ctx.bezierCurveTo(-p.r * 0.7, -p.r * 0.2, -p.r * 0.5, -p.r * 0.8, 0, -p.r * 0.9);
                    this.ctx.closePath();
                } else if (p.leafShape === 'maple') {
                    const r = p.r;
                    this.ctx.moveTo(0, -r);
                    this.ctx.bezierCurveTo(r * 0.2, -r * 0.7, r * 0.5, -r * 0.7, r * 0.5, -r * 0.3);
                    this.ctx.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.7, r * 0.2, r * 0.3, r * 0.2);
                    this.ctx.bezierCurveTo(r * 0.7, r * 0.5, r * 0.2, r * 0.7, 0, r * 0.5);
                    this.ctx.bezierCurveTo(-r * 0.2, r * 0.7, -r * 0.7, r * 0.5, -r * 0.3, r * 0.2);
                    this.ctx.bezierCurveTo(-r * 0.7, r * 0.2, -r * 0.9, -r * 0.2, -r * 0.5, -r * 0.3);
                    this.ctx.bezierCurveTo(-r * 0.5, -r * 0.7, -r * 0.2, -r * 0.7, 0, -r);
                    this.ctx.closePath();
                } else if (p.leafShape === 'elm') {
                    this.ctx.ellipse(0, p.r * 0.5, p.r * 0.6, p.r * 0.28, 0, 0, Math.PI * 2);
                }
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
                if (p.edgeColor) {
                    this.ctx.strokeStyle = p.edgeColor;
                    this.ctx.lineWidth = 1.1;
                    this.ctx.stroke();
                }
            } finally {
                this.ctx.restore();
            }
        }
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
        this.ctx.clearRect(0, 0, this.width, this.height);
        if(this.type === 'lightning'){
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
        
        this.animationId = requestAnimationFrame(this._animate);
    }

    _drawFaerieLight() {
        const t = Date.now() * 0.001;
        const whiteColor = 'rgba(255, 255, 255, 1)';
        for (let p of this.particles) {
            const hue = (p.hue ?? 0) + t * 40;
            const colorInt = Math.round(hue % 360);
            if (!p._cachedColorStr || p._cachedHue !== colorInt) {
                p._cachedColorStr = `hsl(${colorInt}, 90%, 70%)`;
                p._cachedHue = colorInt;
            }
            p.x += Math.sin(t * 0.7 + (p.phase ?? 0)) * 0.08 + (p.drift ?? 0) * 0.04;
            p.y += Math.cos(t * 0.5 + (p.phase ?? 0)) * 0.08;
            this.ctx.save();
            this.ctx.globalAlpha = (p.alpha ?? 1);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r ?? 2, 0, Math.PI * 2);
            this.ctx.fillStyle = p._cachedColorStr;
            this.ctx.shadowColor = p._cachedColorStr;
            this.ctx.shadowBlur = 18;
            this.ctx.fill();
            this.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.ctx.fillStyle = whiteColor;
            this.ctx.shadowBlur = 2;
            this.ctx.fill();
            this.ctx.restore();
        }
        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            if (p.x >= -20 && p.x <= this.width + 20 &&
                p.y >= -20 && p.y <= this.height + 20) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
        
        while (this.particles.length < this.intensity) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1 + Math.random() * 2,
                alpha: 0.7 + Math.random() * 0.3,
                hue: Math.random() * 360,
                drift: -0.5 + Math.random(),
                phase: Math.random() * Math.PI * 2,
                _cachedColorStr: '', _cachedHue: -1
            });
        }
    }

    _drawFireflies() {
        const t = Date.now() * 0.001;
        const whiteColor = 'rgba(255, 255, 255, 1)';
        const greenColor = 'rgba(200,255,120,1)';
        const yellowColor = 'rgba(255,255,180,1)';
        for (let p of this.particles) {
            const blink = 0.5 + 0.5 * Math.sin(t * p.blinkSpeed + p.blinkPhase);
            p.wanderAngle += (Math.random() - 0.5) * 0.1;
            p.x += Math.cos(p.wanderAngle) * p.wanderSpeed;
            p.y += Math.sin(p.wanderAngle) * p.wanderSpeed;
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha * blink;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 16;
            this.ctx.fill();
            this.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.ctx.fillStyle = whiteColor;
            this.ctx.shadowBlur = 2;
            this.ctx.fill();
            this.ctx.restore();
        }
        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            if (p.x >= -20 && p.x <= this.width + 20 &&
                p.y >= -20 && p.y <= this.height + 20) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
        
        while (this.particles.length < this.intensity) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1 + Math.random() * 2,
                alpha: 0.7 + Math.random() * 0.3,
                blinkPhase: Math.random() * Math.PI * 2,
                blinkSpeed: 1.2 + Math.random() * 0.8,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderSpeed: 0.2 + Math.random() * 0.2,
                color: Math.random() > 0.5 ? greenColor : yellowColor
            });
        }
    }

    _drawEmbers() {
        const whiteColor = 'rgba(255, 255, 255, 1)';
        const embersColor1 = 'rgba(255,180,60,1)';
        const embersColor2 = 'rgba(255,100,0,1)';
        for (let p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha * (1 - p.life / p.maxLife);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, false);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 16;
            this.ctx.fill();
            this.ctx.arc(p.x, p.y, 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = whiteColor;
            this.ctx.shadowBlur = 2;
            this.ctx.fill();
            this.ctx.restore();
            p.x += p.windDx + (Math.random() - 0.5) * 0.2;
            p.y += p.windDy + (Math.random() - 0.5) * 0.2;
            p.life++;
        }
        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            if (p.x >= -20 && p.x <= this.width + 20 &&
                p.y >= -20 && p.y <= this.height + 20 &&
                p.life <= p.maxLife) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
        
        while (this.particles.length < this.intensity) {
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
                color: Math.random() > 0.5 ? embersColor1 : embersColor2
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
                this.ctx.save();
                this.ctx.globalAlpha = p.alpha;
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.quadraticCurveTo(p.r * 0.5, -p.r * 0.7, 0, -p.r);
                this.ctx.quadraticCurveTo(-p.r * 0.5, -p.r * 0.7, 0, 0);
                this.ctx.closePath();
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 4;
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        for (let p of this.particles) {
            if (p.type !== 'blossom') continue;
            const pathVar = Math.sin(t * 0.7 + p.pathVar) * 1.5 + Math.cos(t * 0.5 + p.pathVar) * 1.5;
            p.angle += p.spin;
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            
            for (let petal = 0; petal < 5; petal++) {
                this.ctx.save();
                const petalAngle = (Math.PI * 2 / 5) * petal + (Math.random() - 0.5) * 0.10;
                this.ctx.rotate(petalAngle);
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.bezierCurveTo(
                    p.r * 0.28, -p.r * 0.18,
                    p.r * 0.38, -p.r * 0.55,
                    0, -p.r * 0.62
                );
                this.ctx.bezierCurveTo(
                    -p.r * 0.38, -p.r * 0.55,
                    -p.r * 0.28, -p.r * 0.18,
                    0, 0
                );

                if (!p.gradient || p._gradientR !== p.r) {
                    p.gradient = this.ctx.createLinearGradient(0, 0, 0, -p.r);
                    p.gradient.addColorStop(0, p.petalColor);
                    p.gradient.addColorStop(0.7, p.tipColor);
                    p.gradient.addColorStop(1, 'rgba(255,255,255,0.13)');
                    p._gradientR = p.r;
                }
                
                this.ctx.fillStyle = p.gradient;
                this.ctx.shadowColor = p.tipColor;
                this.ctx.shadowBlur = 7;
                this.ctx.fill();
                this.ctx.restore();
            }
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
            this.ctx.lineWidth = p.r * 0.09;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            this.ctx.shadowColor = 'rgba(255,255,255,0.18)';
            this.ctx.shadowBlur = 2;
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.r * 0.18, 0, Math.PI * 2);
            this.ctx.fillStyle = p.centerColor;
            this.ctx.shadowColor = p.centerColor;
            this.ctx.shadowBlur = 2;
            this.ctx.fill();
            this.ctx.restore();
            p.x += p.windDx + pathVar * 0.03;
            p.y += p.windDy + pathVar * 0.03;
            p.y += p.speed;
        }

        let writeIdx = 0;
        for (let readIdx = 0; readIdx < this.particles.length; readIdx++) {
            const p = this.particles[readIdx];
            if (p.x >= -20 && p.x <= this.width + 20 &&
                p.y >= -20 && p.y <= this.height + 20) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;

        let currentBlossoms = 0;
        let currentPetals = 0;
        for (let p of this.particles) {
            if (p.type === 'blossom') currentBlossoms++;
            if (p.type === 'petal') currentPetals++;
        }

        while (currentBlossoms < this.intensity) {
            let baseX = Math.random() * (this.width + 40) - 20;
            let baseY = Math.random() * (this.height + 40) - 20;
            this.particles.push({
                type: 'blossom',
                x: baseX, y: baseY, r: 6 + Math.random() * 4,
                alpha: 0.7 + Math.random() * 0.3, drift: -0.5 + Math.random(),
                speed: 0.2 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2,
                angle: Math.random() * Math.PI * 2, spin: -0.03 + Math.random() * 0.06,
                windDx: this._windDx, windDy: this._windDy, pathVar: Math.random() * 1000,
                petalColor: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.85)`,
                tipColor: `rgba(255,${120+Math.floor(Math.random()*60)},${200+Math.floor(Math.random()*40)},0.95)`,
                centerColor: 'rgba(255,220,230,0.7)', gradient: null, _gradientR: -1
            });
            currentBlossoms++;
        }

        while (currentPetals < this.intensity) {
            this.particles.push({
                type: 'petal',
                x: Math.random() * this.width, y: Math.random() * this.height,
                r: 2.5 + Math.random() * 2.5, alpha: 0.5 + Math.random() * 0.4,
                drift: -0.7 + Math.random() * 1.4, speed: 0.12 + Math.random() * 0.13,
                phase: Math.random() * Math.PI * 2, angle: Math.random() * Math.PI * 2,
                spin: -0.04 + Math.random() * 0.08, windDx: this._windDx * 1.1,
                windDy: this._windDy * 1.1, pathVar: Math.random() * 1000,
                color: `rgba(255,${170+Math.floor(Math.random()*40)},${190+Math.floor(Math.random()*30)},0.82)`
            });
            currentPetals++;
        }
    }

    _drawLightning() {
        if (!this._lightningTimer || this._lightningTimer <= 0) {
            this._lightningAlpha = 0.18 + Math.random() * 0.10;
            this._lightningTimer = (360 / this.intensityMultiplier + Math.floor(Math.random() * 360));
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
                (this._lightningStrike.x + Math.cos(this._lightningStrike.angle) * this._lightningStrike.length * 0.5) / window.CURRENT_SCENE_DATA.scale_factor,
                (this._lightningStrike.y + Math.sin(this._lightningStrike.angle) * this._lightningStrike.length * 0.5) / window.CURRENT_SCENE_DATA.scale_factor,
                glowRadiusX / window.CURRENT_SCENE_DATA.scale_factor,
                glowRadiusY / window.CURRENT_SCENE_DATA.scale_factor,
                this._lightningStrike.angle,
                0,
                Math.PI * 2
            );
            this.lightCtx.fillStyle = 'rgba(255,255,255,0.22)';
            this.lightCtx.shadowColor = '#fff';
            this.lightCtx.shadowBlur = 120;
            this.lightCtx.fill();
            this.lightCtx.restore();

            this.ctx.save();
            this.ctx.globalAlpha = glowAlpha;
            this.ctx.beginPath();
            this.ctx.ellipse(
                this._lightningStrike.x + Math.cos(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                this._lightningStrike.y + Math.sin(this._lightningStrike.angle) * this._lightningStrike.length * 0.5,
                glowRadiusX,
                glowRadiusY,
                this._lightningStrike.angle,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(255,255,255,0.22)';
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 120;
            this.ctx.fill();
            this.ctx.restore();
            
            this.ctx.globalAlpha = this._lightningAlpha * 0.7;
            this.ctx.save();
            this.ctx.translate(this._lightningStrike.x, this._lightningStrike.y);
            this.ctx.rotate(this._lightningStrike.angle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(this._lightningStrike.length, 0);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            this.ctx.lineWidth = 7 + Math.random() * 4;
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 32 + Math.random() * 24;
            this.ctx.stroke();
            this.ctx.restore();
            this._lightningAlpha -= 0.012;
            this._lightningFlashFrames--;
        } else {
            this._lightningAlpha = 0;
        }
        this._lightningTimer--;
        this._drawRain();
    }

    _drawRain() {
        const whiteStr = 'rgba(255, 255, 255, 1)';
        const rainStr = 'rgba(255, 255, 255, 0.85)';
        const shadowColor = '#00aeff80';
        const shadowBlur8 = 8;
        const shadowBlur10base = 10;
        
        for (let idx = 0; idx < this.particles.length; idx++) {
            const p = this.particles[idx];
            if (p.splash && p.start == true) {
                this.ctx.save();
                let fade = 1;
                if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 10)) {
                    fade = p.fadeIn / (p.fadeInFrames || 10);
                    p.fadeIn++;
                }
                const progress = p.life / p.maxLife;
                this.ctx.globalAlpha = 0.4 * (1 - progress) * fade;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.r * (1 + progress * 1.5), 0, Math.PI * 2);
                this.ctx.strokeStyle = whiteStr;
                this.ctx.lineWidth = 1.2 + 1.5 * (1 - progress);
                this.ctx.shadowColor = shadowColor;
                this.ctx.shadowBlur = shadowBlur8;
                this.ctx.stroke();
                this.ctx.restore();
                p.life++;
                if (p.life > p.maxLife) {
                    const dropletIdx = this._particleIndex.get(p.dropletId);
                    if (dropletIdx !== undefined) {
                        const droplet = this.particles[dropletIdx];
                        p.x = droplet.groundX;
                        p.y = droplet.groundY;
                        p.life = 0;
                        p.maxLife = 18 + Math.random() * 10;
                        p.fadeIn = 0;
                    }
                    p.start = false;
                }
            } else if (!p.splash) {
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
                const zInv = 1 - p.z;
                const streakLen = 18 + 22 * zInv;
                const endX = p.x + Math.sin(this.angleRadians) * streakLen;
                const endY = p.y + Math.cos(this.angleRadians) * streakLen;
                this.ctx.save();
                this.ctx.globalAlpha = 0.2 + (2 * zInv * fade * 0.8);
                this.ctx.strokeStyle = rainStr;
                this.ctx.lineWidth = 1.4 + 1.7 * zInv;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.shadowColor = shadowColor;
                this.ctx.shadowBlur = shadowBlur10base * zInv;
                this.ctx.stroke();
                this.ctx.restore();
                if (p.z >= 1) {
                    const splashIdx = this._particleIndex.get('splash_' + p.id);
                    if (splashIdx !== undefined) {
                        const splash = this.particles[splashIdx];
                        splash.x = p.groundX;
                        splash.y = p.groundY;
                        splash.life = 0;
                        splash.maxLife = 18 + Math.random() * 10;
                        splash.fadeIn = 0;
                        splash.start = true;
                    }

                    const groundX = Math.random() * this.width;
                    const groundY = Math.random() * this.height;
                    p.startX = groundX - this.horizontalOffset;
                    p.startY = groundY - this.height * (0.5 + Math.random() * 0.5);
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
            this.ctx.save();
            this.ctx.globalAlpha = (p.alpha ?? 1) * fade;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle + Math.sin(t * 0.7 + p.phase) * 0.7);


            if (!p.gradient) {
                p.gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
                p.gradient.addColorStop(0, 'rgba(255,255,255,1)');
                p.gradient.addColorStop(0.7, 'rgba(220,240,255,0.7)');
                p.gradient.addColorStop(1, 'rgba(200,220,255,0.1)');
            }
            
            this.ctx.fillStyle = p.gradient;
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const theta = (Math.PI * 2 / 6) * i;
                this.ctx.lineTo(Math.cos(theta) * p.r, Math.sin(theta) * p.r);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();
            if (p.y >= p.groundY) {
                const groundX = Math.random() * this.width;
                const groundY = (1 + Math.random() * 0.25) * this.height;
                const startY = groundY - (1.25 * this.height);
                const ratio = startY / groundY;
                p.startX = groundX;
                p.startY = startY;
                p.groundX = groundX;
                p.groundY = groundY;
                p.z = ratio;
                p.r = 2 + Math.random() * 4;
                p.alpha = 0.8 + Math.random() * 0.2;
                p.drift = 1 + Math.random() * 100 * this.intensityMultiplier;
                p.speed = (0.0001 + Math.random() * 0.0002) * this.intensityMultiplier;
                p.phase = Math.random() * Math.PI * 2;
                p.angle = Math.random() * Math.PI * 2 * this.intensityMultiplier;
                p.spin = -0.01 + Math.random() * 0.02;
                p.wind = (0.001 + Math.random() * 0.025) * this.intensityMultiplier * this.intensityMultiplier;
                p.fadeIn = 1;
                p.gradient = null; 
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
            const alphaValue = p.alpha * 1.2 + 0.22;
            const alphaKey = Math.round(alphaValue * 1000);
            if (!p._cachedFogColor || p._cachedAlphaKey !== alphaKey) {
                p._cachedFogColor = `rgba(120, 120, 120, ${alphaValue.toFixed(3)}`;
                p._cachedAlphaKey = alphaKey;
            }
            let fade = 1;
            if (p.fadeIn !== undefined && p.fadeIn < (p.fadeInFrames || 10)) {
                fade = p.fadeIn / (p.fadeInFrames || 10);
                p.fadeIn++;
            }
            this.ctx.globalAlpha = alphaValue * fade;
            this.ctx.shadowColor = p._cachedFogColor;
            this.ctx.shadowBlur = 1;
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy, baseR * (1.1 + 0.2 * Math.sin(t * 0.9 + p.phase)), baseR * baseAspect * (0.8 + 0.2 * Math.cos(t * 0.8 + p.phase)), 0, 0, Math.PI * 2);
            this.ctx.fillStyle = p._cachedFogColor;
            this.ctx.fill();
            for (let j = 0; j < 3; j++) {
                const angle = p.phase + j * 2.1;
                const dist = baseR * (0.32 + 0.18 * Math.sin(t * 0.6 + p.phase + j));
                const subCx = cx + Math.cos(angle) * dist;
                const subCy = cy + Math.sin(angle) * dist;
                const subR = baseR * (0.62 + 0.18 * Math.cos(t * 0.5 + p.phase + j));
                const subAspect = baseAspect * (0.8 + 0.25 * Math.sin(t * 0.7 + p.phase + j));
                this.ctx.beginPath();
                this.ctx.ellipse(subCx, subCy, subR * (1 * (j + 1) + 0.18 * Math.sin(t * 0.9 + p.phase + j)), subR * subAspect * (0.7 * (j + 1) + 0.2 * Math.cos(t * 0.8 + p.phase + j)), 0, 0, Math.PI * 2);
                this.ctx.fillStyle = p._cachedFogColor;
                this.ctx.globalAlpha = (p.alpha * 0.7 + 0.13) * (0.8 - 0.15 * j) * fade;
                this.ctx.fill();
            }
            p.x += this._windDx * (0.7 + 0.6 * (p.r / 56));
            p.y += this._windDy * (0.7 + 0.6 * (p.r / 56));
            if (p.x < -p.r || p.x > this.width + p.r || p.y < -p.r || p.y > this.height + p.r) {
                p.x = Math.random() * (this.width + 200) - 100;
                p.y = Math.random() * (this.height + 200) - 100;
                p.phase = Math.random() * Math.PI * 2;
                p.fadeIn = 1;
                p.r = 200 + Math.random() * this.width / 100;
                p._cachedFogColor = null; // Invalidate cached color on particle reset
                p._cachedAlphaKey = -1;
            }
        }
    }
}

function ensure_weather() {
    if(window.WeatherOverlay == undefined){
        const weatherCanvas = $('#weather_overlay');
        const weatherLightCanvas = $('#weather_light');
        window.WeatherOverlay = new WeatherOverlay(weatherCanvas[0], weatherLightCanvas[0]);
    }
}
function set_weather(){
    ensure_weather();
    window.WeatherOverlay.setType(window.CURRENT_SCENE_DATA.weather || 'none', window.CURRENT_SCENE_DATA.weatherIntensity);
}
function set_weather_size(w, h){
    ensure_weather();
    window.WeatherOverlay.setSize(w, h);
    set_weather();
}

function getWeatherTypes() {
    return {
        'rain': { type: 'Rain', min: 0, default: 180, max: 360 },
        'snow': { type: 'Snow', min: 0, default: 320, max: 640 },
        'fog': { type: 'Fog', min: 0, default: 10, max: 20 },
        'embers': { type: 'Embers', min: 0, default: 40, max: 80 },
        'cherryBlossoms': { type: 'Cherry Blossoms', min: 0, default: 40, max: 80 },
        'lightning': { type: 'Lightning', min: 0, default: 60, max: 120, lit: true },
        'faerieLight': { type: 'Faerie Light', min: 0, default: 23, max: 46 },
        'fireflies': { type: 'Fireflies', min: 0, default: 28, max: 56 },
        'leaves': { type: 'Fall Leaves', min: 0, default: 32, max: 64 },
        'greenLeaves': { type: 'Green Leaves', min: 0, default: 32, max: 64 }
    };
}
