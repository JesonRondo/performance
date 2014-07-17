/**
 * 前端性能指标显示
 * @buji
 * @create 2014-07-14
 */
(function($) {
    if (!(window.performance && window.self === top))
        return; // 不支持 performance 或者 不是 top 的直接return

    var webapp = {};

    webapp.performance = (function() {
        var canvas = null,
            $canvas = null,
            context = null;

        var displayMode = 'min'; // min or normal

        var updateTimer = 0,
            renderTimer = 0;

        var canvas_width = 142,
            canvas_height = 120,
            canvas_width_min = 32,
            canvas_height_min = 32;

        var timing = window.performance.timing;

        var cpuData = [],
            domCount,
            requestTime,
            responseTime;

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

        var renderMin = function() {
            for (var i = cpuData.length - 1, len = cpuData.length - canvas_width_min / 2; i >= len; i--) {
                var x = (i + 1) * 2 - (cpuData.length * 2 - canvas_width_min),
                    y = canvas_height_min,
                    h = cpuData[i] / 100 * canvas_height_min > canvas_height_min ?
                            canvas_height_min :
                            (cpuData[i] / 100 * canvas_height_min < 0 ?
                                0 :
                                cpuData[i] / 100 * canvas_height_min);

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
            context.fillText("Cpu", 0, 10);
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
            context.fillText("Request: " + requestTime + 'ms', 16, 94);
            context.fillText("Response: " + responseTime + 'ms', 16, 110);
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

        var updateData = function() {
            updateCpuData();
            updateDomCountData();
            updateRequestAndResponse();
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
                        'top: 0;',
                        'right: 0;',
                        'cursor: pointer;',
                    '}',
                '</style>'
            ].join(''));

            canvas.width = canvas_width_min;
            canvas.height = canvas_height_min;
            // canvas.width = canvas_width;
            // canvas.height = canvas_height;
            // canvas.style.position = 'fixed';
            // canvas.style.top = '4px';
            // canvas.style.left = document.body.clientWidth - canvas_width - 6 +'px';
            // canvas.style.background = 'rgba(0, 0, 0, 0.5)';
            // canvas.style.border = '1px solid #666';
            // canvas.style.zIndex = 100000;
            // canvas.style.borderRadius = '2px';
            // canvas.style.opacity = 0.8;
            // canvas.style.transition = 'opacity .3s';

            $canvas.addClass('m-performance-widget');
            $canvas.addClass('m-performance-widget-min');
            
            // canvas.style.cursor = 'move';
            // canvas.setAttribute('draggable', true);

            document.body.appendChild(canvas);

            context = canvas.getContext('2d');
        };

        var initEvent = function() {
            // canvas.ondragend = function(e) {
            //     canvas.style.top = e.clientY - parseInt(canvas.height, 10) - 2 + 'px';
            //     canvas.style.left = parseInt(canvas.style.left, 10) + e.offsetX + 'px';
            // };

            canvas.onmouseenter = function() {
                canvas.style.opacity = 1;
            };

            canvas.onmouseleave = function() {
                canvas.style.opacity = 0.8;
            };

            canvas.ondblclick = function() {
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
