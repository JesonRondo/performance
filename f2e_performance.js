/**
 * 前端性能指标显示
 * @buji
 * @create 2014-07-14
 */
(function($) {
    if (!(window.performance && window.self === top))
        return; // 不支持 performance 或者 不是 top 的直接return

    if (window.localStorage) { // 已关闭
        if (window.localStorage.getItem('f2efpm_hide') === "true") return;
    }

    var webapp = {};

    webapp.performance = (function() {
        var canvas = null,
            $canvas = null,
            context = null;

        var displayMode = 'min'; // min or normal

        var updateTimer = 0,
            renderTimer = 0;

        var canvas_width = 142,
            canvas_height = 152,
            canvas_width_min = 32,
            canvas_height_min = 32;

        var highLimit = 5000; // ms

        var timing = window.performance.timing;

        var cpuData = [],
            domCount,
            requestTime,
            responseTime,
            documentReadyTime,
            documentOnloadTime;

        for (var i = 0; i < 50; i++) {
            cpuData.push(0);
        }

        var t = +new Date,
            fps = 50,
            dataFps = 14;

        var clean = function() {
            switch(displayMode) {
                case 'min':
                    context.clearRect(0, 0, canvas_width_min, canvas_height_min);
                    break;
                case 'normal':
                    context.clearRect(0, 0, canvas_width, canvas_height);
                    break;
            }
        };

        var setRenderColor = function(v) {
            // min
            if (v == null) {
                if (requestTime < highLimit &&
                    responseTime < highLimit &&
                    documentReadyTime < highLimit) {
                    return {
                        boll_dark: 'rgba(20, 144, 62, .8)',
                        boll_light: 'rgba(144, 250, 118, .8)',
                        line: '#d2fed4'
                    };
                } else if (requestTime < 4 * highLimit &&
                    responseTime < 4 * highLimit &&
                    documentReadyTime < 4 * highLimit) {
                    return {
                        boll_dark: 'rgba(241, 106, 32, .8)',
                        boll_light: 'rgba(249, 157, 107, .8)',
                        line: '#fde1d1'
                    };
                } else {
                    return {
                        boll_dark: 'rgba(239, 37, 38, .8)',
                        boll_light: 'rgba(250, 129, 129, .8)',
                        line: '#fde3e3'
                    };
                }
            }

            // normal
            if (v < highLimit) {
                context.fillStyle = '#fff';
            } else {
                context.fillStyle = '#ff6e4c';
            }
        };

        function calGraphicalCpuData(x, h) {
            var delta = Math.sqrt(canvas_height_min * x - x * x - 31);
            var y = [canvas_height_min / 2 - delta, canvas_height_min / 2 + delta];

            var realY = [(h > canvas_height_min - y[1]) ? y[1] : 0, (h > canvas_height_min - y[0]) ? y[0] : canvas_height_min - h];
            // console.log(x, h, realY);
            return realY;
        }

        var renderMin = function() {
            var grd, colors = setRenderColor();

            // 底色
            context.save();
            grd = context.createRadialGradient(24, 24, 16, 0, 0, 16);
            grd.addColorStop(0, colors.boll_dark);
            grd.addColorStop(1, colors.boll_light);
            context.fillStyle = grd;
            context.beginPath();
            context.arc(16, 16, 16, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
            context.restore();

            // cpu
            for (var i = cpuData.length - 1, len = cpuData.length - canvas_width_min / 2; i >= len; i--) {
                var x = (i + 1) * 2 - (cpuData.length * 2 - canvas_width_min),
                    // y = canvas_height_min,
                    h = cpuData[i] / 100 * canvas_height_min > canvas_height_min ?
                            canvas_height_min :
                            (cpuData[i] / 100 * canvas_height_min < 0 ?
                                0 :
                                cpuData[i] / 100 * canvas_height_min);
                var y = calGraphicalCpuData(x, h);

                if (y[0] == 0) continue;

                context.beginPath(); //直线开始
                context.moveTo(x, y[0]); //直线的起点
                context.lineTo(x, y[1]); //直线的终点
                context.lineWidth = 2; //直线的宽度
                context.strokeStyle = colors.line; //直线的颜色
                context.lineCap = 'square'; //直线端点：round、butt、square
                context.stroke(); //直线结束
            }

            // 边缘反光
            context.save();
            grd = context.createRadialGradient(20, 20, 16, 6, 6, 20);
            grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
            context.fillStyle = grd;
            context.beginPath();
            context.arc(16, 16, 16, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
            context.restore();

            // 高光渐变
            context.save();
            grd = context.createRadialGradient(12, 12, 16, 26, 26, 20);
            grd.addColorStop(0, 'rgba(0, 0, 0, .2)');
            grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = grd;
            context.beginPath();
            context.arc(16, 16, 16, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
            context.restore();
            
            // 高光
            context.save();
            grd = context.createLinearGradient(8, 8, 16, 16);
            grd.addColorStop(0, "rgba(255, 255, 255, 1)");
            grd.addColorStop(1, "rgba(255, 255, 255, 0)");
            context.fillStyle = grd;
            context.beginPath();
            context.arc(16 / 1 - 2, 16 / 1.5 + 2, 10, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            context.restore();            
        };

        var renderNormal = function() {
            for (var i = cpuData.length - 1; i >= 0; i--) {
                var x = (i + 1) * 2 + 21 - 1,
                    y = 60,
                    h = cpuData[i] / 2 > 50 ?
                            50 :
                            (cpuData[i] / 2 < 0 ?
                                0 :
                                cpuData[i] / 2);

                context.beginPath(); //直线开始
                context.moveTo(x, y); //直线的起点
                context.lineTo(x, y - h); //直线的终点
                context.lineWidth = 2; //直线的宽度
                context.strokeStyle = '#12e8f5'; //直线的颜色
                context.lineCap = 'square'; //直线端点：round、butt、square
                context.stroke(); //直线结束
            }

            context.font = "12px Tahoma";
            context.fillStyle = '#fff';
            context.fillText("Cpu:", 16, 20);

            context.fillText("Dom: " + domCount, 16, 78);
            setRenderColor(requestTime);
            context.fillText("Request: " + (requestTime < 0 ? '-' : (requestTime + 'ms')), 16, 94);
            setRenderColor(responseTime);
            context.fillText("Response: " + (responseTime < 0 ? '-' : (responseTime + 'ms')), 16, 110);
            setRenderColor(documentReadyTime);
            context.fillText("Ready: " + (documentReadyTime < 0 ? '-' : (documentReadyTime + 'ms')), 16, 126);
            setRenderColor(documentOnloadTime);
            context.fillText("Onload: " + (documentOnloadTime < 0 ? '-' : (documentOnloadTime + 'ms')), 16, 142);
        };

        var render = function() {
            clean();

            switch(displayMode) {
                case 'min':
                    renderMin();
                    break;
                case 'normal':
                    renderNormal();
                    break;
            }
        };

        var updateCpuData = function() {
            var x_count = 50;

            var nt = +new Date;
            cpuData.push(nt - t - 1000 / dataFps);
            t = nt;
            
            if (cpuData.length > x_count) {
                cpuData = cpuData.splice(cpuData.length - x_count);
            }
        };

        var updateDomCountData = function() {
            domCount = $(document).find('*').length;
        };

        var updateRequestAndResponse = function() {
            requestTime = timing.responseStart - timing.requestStart;
            responseTime = timing.responseEnd - timing.responseStart;
        };

        var updateDomReadyAndOnload = function() {
            documentReadyTime = timing.domInteractive - timing.domainLookupStart;
            documentOnloadTime = timing.domComplete - timing.domainLookupStart;
        };

        var updateData = function() {
            updateCpuData();
            updateDomCountData();
            updateRequestAndResponse();
            updateDomReadyAndOnload();
        };

        var initCanvas = function() {
            canvas = document.createElement('canvas');

            if (!canvas.getContext) return false;

            $canvas = $(canvas);

            $('head').append([
                '<style>',
                    '.m-performance-widget {',
                        'position: fixed;',
                        'top: 4px;',
                        'right: 4px;',
                        'background: rgba(0, 0, 0, 0.5);',
                        'border: 1px solid #666;',
                        'z-index: 100000;',
                        'border-radius: 2px;',
                        'opacity: .8;',
                        'transition: opacity .3s;',
                    '}',
                    '.m-performance-widget-min {',
                        'top: 8px;',
                        'right: 12px;',
                        'cursor: pointer;',
                        'border: none;',
                        'opacity: 1!important;',
                        'background: none;',
                        // 'border-radius: 16px;',
                        // 'box-shadow: 1px 1px 4px rgba(0, 0, 0, .1)',
                    '}',
                '</style>'
            ].join(''));

            canvas.width = canvas_width_min;
            canvas.height = canvas_height_min;

            $canvas.addClass('m-performance-widget');
            $canvas.addClass('m-performance-widget-min');

            document.body.appendChild(canvas);

            context = canvas.getContext('2d');
        };

        var initEvent = function() {
            canvas.onmouseenter = function() {
                canvas.style.opacity = 1;
            };

            canvas.onmouseleave = function() {
                canvas.style.opacity = 0.8;
            };

            canvas.ondblclick = function() {
                if (window.localStorage) {
                    window.localStorage.setItem('f2efpm_hide', "true");
                }

                clearInterval(updateTimer);
                clearInterval(renderTimer);
                $canvas.remove();
            };

            canvas.onclick = function(e) {
                if ($canvas.hasClass('m-performance-widget-min')) {
                    $canvas.removeClass('m-performance-widget-min');
                    canvas.width = canvas_width;
                    canvas.height = canvas_height;

                    displayMode = 'normal';
                } else {
                    $canvas.addClass('m-performance-widget-min');
                    canvas.width = canvas_width_min;
                    canvas.height = canvas_height_min;

                    displayMode = 'min';
                }
            };
        };

        return {
            init: function() {
                if (initCanvas() === false) {
                    return;
                }

                initEvent();
                
                updateData();
                render();

                updateTimer = setInterval(function() {
                    updateData();
                }, 1000 / dataFps);

                renderTimer = setInterval(function() {
                    render();
                }, 1000 / fps);
            }
        };
    }($));

    $(function() {
        webapp.performance.init();
    });
}(jQuery));
