/**
 * @buji 性能指标 移动
 */
define(function() {

    var doc = document,
        win = window,
        head = doc.getElementsByTagName('head')[0],
        body = doc.getElementsByTagName('body')[0],

        _ = {};

    // 获取性能参数
    _.performace = {
        // 隐藏图片的额外下载
        unuseImgDownload: function() {
            var useImgs = [],
                unuseImgs = [],
                allDom = doc.querySelectorAll('*');

            Array.prototype.forEach.call(allDom, function(item) {
                var bgSrc = win.getComputedStyle(item).backgroundImage,
                    attrSrc = item.getAttribute('src'),
                    tagname = item.tagName.toLowerCase();

                // 有图片的元素
                if ((bgSrc !== 'none' && bgSrc.indexOf('url') === 0) || (tagname === 'img' && attrSrc)) {
                    var matchRet = (bgSrc !== 'none' ? bgSrc : attrSrc).match(/(\/\/)([\w|.|\/]+)(\)|\s)?/);

                    if (matchRet && matchRet[2]) {
                        var img = matchRet[2];

                        if (
                            ((item.offsetHeight === 0 || item.offsetWidth === 0) || // display: none
                            win.getComputedStyle(item).visibility === 'hidden') // visibility: hidden
                        ) {
                            unuseImgs.push(img);
                        } else {
                            useImgs.push(img);
                        }
                    }


                }
            });

            // 过滤sprite或者同一个显示的图片
            var ulen = useImgs.length,
                nlen = unuseImgs.length;

            for (var i = 0; i < ulen; i++) {
                for (var j = 0; j < nlen; j++) {
                    if (useImgs[i] === unuseImgs[j]) {
                        unuseImgs.splice(j, 1);
                        nlen--;
                    }
                }

                if (nlen <= 0) break;
            }

            return unuseImgs.length;
        },

        // 外联样式数量
        outerLink: function() {
            var linksElem = doc.querySelectorAll('link'),
                cssLink = [];

            Array.prototype.forEach.call(linksElem, function(item) {
                if (/.css/.test(item.href)) {
                    cssLink.push(item.href);
                }
            });

            return cssLink.length;
        },

        // css3性能
        css3Boxshadow: function() {
            var count = 0,
                allDom = doc.querySelectorAll('*');

            Array.prototype.forEach.call(allDom, function(item) {
                if (win.getComputedStyle(item).boxShadow !== 'none') {
                    count++;
                }
            });

            return count;
        },

        // no iframe
        useIframe: function() {
            return doc.querySelectorAll('iframe').length;
        },

        // rate
        rate: function() {
            var r_unuseImg, n_unuseImg,
                r_outerLink, n_outerLink,
                r_css3Boxshadow, n_css3Boxshadow,
                r_useiframe, n_useiframe;

            var getScore = function(rate, max, weights) {
                if (rate > max) rate = max;
                return rate / max * weights;
            };

            n_unuseImg = this.unuseImgDownload();
            n_outerLink = this.outerLink();
            n_css3Boxshadow = this.css3Boxshadow();
            n_useiframe = this.useIframe();

            r_unuseImg = getScore(n_unuseImg, 5, 10); // 10  max 5
            r_outerLink = getScore(n_outerLink, 5, 10); // 10  max 5
            r_css3Boxshadow = getScore(n_css3Boxshadow, 5, 40); // 40  max 5
            r_useiframe = getScore(n_useiframe, 1, 40); // 40 max 1

            return {
                score: 100 - (r_unuseImg + r_outerLink + r_css3Boxshadow + r_useiframe),
                detail: {
                    unuseImg: n_unuseImg,
                    outerLink: n_outerLink,
                    css3Boxshadow: n_css3Boxshadow,
                    useiframe: n_useiframe
                }
            };
        }

    };

    // 圆圈对象
    _.circle = {
        // 圆圈elem
        $el: null,
        // 其他elem
        $el_helper: {},

        // style
        initStyle: function() {
            var style = doc.createElement('style');
            style.innerHTML = [
                '.m-performance{position:fixed;left:0;top:80px;width:32px;height:32px;z-index:10000;background:#fff;border-radius:16px;text-align:center;transition:background .3s, left .3s, top .3s;}',
                '.m-performance-move{transition:background .3s;}',
                '.m-performance .cnt{position:absolute;width:24px;height:24px;top:50%;left:50%;margin:-12px 0 0 -12px;background:#fff;border-radius:12px;font:normal 12px/24px arial, sans-serif;color:#999;}',
                '.m-performance .mask1,.m-performance .mask2{position:absolute;top:0;width:16px;height:32px;transition:transform .3s,background .3s;}',
                '.m-performance .mask1{left:16px;border-radius:0 16px 16px 0;transform-origin:0;}',
                '.m-performance .mask2{left:0;border-radius:16px 0 0 16px;transform-origin:16px;}',
                '.m-performance-lv1, .m-performance-lv1 .mask2-half2{background:#f72929;}',
                '.m-performance-lv1 .mask1, .m-performance-lv1 .mask2-half1{background:#ffefef;}',
                '.m-performance-lv2, .m-performance-lv2 .mask2-half2{background:#ffc62b;}',
                '.m-performance-lv2 .mask1, .m-performance-lv2 .mask2-half1{background:#fff8e6;}',
                '.m-performance-lv3, .m-performance-lv3 .mask2-half2{background:#6ed1ff;}',
                '.m-performance-lv3 .mask1, .m-performance-lv3 .mask2-half1{background:#d6f7ff;}'
            ].join('');
            head.appendChild(style);
        },

        // dom
        initDom: function() {
            this.$el = doc.createElement('div');
            this.$el.classList.add('m-performance');
            this.$el.innerHTML = [
                '<div class="mask1"></div>',
                '<div class="mask2"></div>',
                '<div class="cnt J_performance_rate"></div>'
            ].join('');

            this.$el_helper['rate'] = this.$el.getElementsByClassName('J_performance_rate')[0];
            this.$el_helper['mask1'] = this.$el.getElementsByClassName('mask1')[0];
            this.$el_helper['mask2'] = this.$el.getElementsByClassName('mask2')[0];

            body.appendChild(this.$el);
        },

        // event
        initEvent: function() {
            var $el = this.$el,
                bySide = this.bySide;

            $el.addEventListener('touchstart', function(e) {
                e.preventDefault();

                var startTouchPosition = {
                    x: e.changedTouches[0].screenX,
                    y: e.changedTouches[0].screenY
                };

                var startElemPosition = {
                    x: parseInt(win.getComputedStyle($el).left, 10),
                    y: parseInt(win.getComputedStyle($el).top, 10)
                };

                $el.classList.add('m-performance-move');

                $el.addEventListener('touchmove', function(e) {
                    e.preventDefault();

                    $el.style.left = (e.changedTouches[0].screenX - startTouchPosition.x + startElemPosition.x) + 'px';
                    $el.style.top = (e.changedTouches[0].screenY - startTouchPosition.y + startElemPosition.y) + 'px';
                });

                $el.addEventListener('touchend', function(e) {
                    e.preventDefault();

                    if (e.changedTouches[0].screenX === startTouchPosition.x &&
                        e.changedTouches[0].screenY === startTouchPosition.y) {

                        _.panel.toggle();

                    } else {

                        bySide($el);

                    }

                    $el.classList.remove('m-performance-move');

                    $el.removeEventListener('touchmove');
                    $el.removeEventListener('touchend');
                });
            });
        },

        // 靠边
        bySide: function($el) {

            // 球的尺寸
            var popSize = {
                width: 32,
                height: 32
            };

            // 球的位置
            var popPosition = {
                top: parseInt(win.getComputedStyle($el).top, 10),
                left: parseInt(win.getComputedStyle($el).left, 10)
            };

            // 边界
            var boundary = {
                top: 0,
                left: 0,
                right: doc.documentElement.clientWidth - popSize.width,
                bottom: doc.documentElement.clientHeight - popSize.height
            };

            if (popPosition.left < (boundary.left + boundary.right) / 2) {
                $el.style.left = boundary.left + 'px';
            } else {
                $el.style.left = boundary.right + 'px';
            }
            if (popPosition.top < boundary.top) $el.style.top = boundary.top + 'px';
            if (popPosition.top > boundary.bottom) $el.style.top = boundary.bottom + 'px';

        },

        // 渲染评分
        renderRate: function(rate) {
            rate = rate.score;

            var deg, $el = this.$el,
                $mask1 = this.$el_helper['mask1'],
                $mask2 = this.$el_helper['mask2'],
                $rate = this.$el_helper['rate'];

            $el.classList.remove('m-performance-lv1');
            $el.classList.remove('m-performance-lv2');
            $el.classList.remove('m-performance-lv3');

            if (rate < 40) {
                $el.classList.add('m-performance-lv1');
            } else if (rate < 80) {
                $el.classList.add('m-performance-lv2');
            } else {
                $el.classList.add('m-performance-lv3');
            }

            $mask2.classList.remove('mask2-half1');
            $mask2.classList.remove('mask2-half2');
            
            if (rate < 50) {
                $mask2.style.transform = 'rotate(0deg)';
                $mask2.classList.add('mask2-half1');
            } else {
                $mask2.style.transform = 'rotate(180deg)';
                $mask2.classList.add('mask2-half2');
            }

            $rate.innerHTML = rate;
            deg = (rate / 100 * 360) >>> 0;
            $mask1.style.transform = 'rotate(' + deg + 'deg)';
        },

        // init
        init: function() {
            this.initStyle();
            this.initDom();
            this.initEvent();
        }
    };

    _.panel = {
        // 面板elem
        $el: null,
        // 其他elem
        $el_helper: {},

        // style
        initStyle: function() {
            var style = doc.createElement('style');
            style.innerHTML = [
                '.m-performance-panel{position:fixed;padding:8px 0;width:100%;bottom:0;background:linear-gradient(rgba(0, 0, 0, .5),rgba(0, 0, 0, .9));transition:transform .3s;color:#fff;}',
                '.m-performance-panel p{padding:0 8px;}',
                '.m-performance-panel-hide{transform:translate(0,100px);}',
            ].join('');
            head.appendChild(style);
        },

        // dom
        initDom: function() {
            this.$el = doc.createElement('div');
            this.$el.classList.add('m-performance-panel');
            this.$el.classList.add('m-performance-panel-hide');
            this.$el.innerHTML = [
                '<p>隐藏图片: <span class="J_a"></span></p>',
                '<p>外联样式: <span class="J_b"></span></p>',
                '<p>box-shadow: <span class="J_c"></span></p>',
                '<p>iframe: <span class="J_d"></span></p>'
            ].join('');

            this.$el_helper['a'] = this.$el.getElementsByClassName('J_a')[0];
            this.$el_helper['b'] = this.$el.getElementsByClassName('J_b')[0];
            this.$el_helper['c'] = this.$el.getElementsByClassName('J_c')[0];
            this.$el_helper['d'] = this.$el.getElementsByClassName('J_d')[0];

            body.appendChild(this.$el);
        },

        // 渲染评分
        renderRate: function(rate) {
            var detail = rate.detail;

            this.$el_helper['a'].innerHTML = detail.unuseImg;
            this.$el_helper['b'].innerHTML = detail.outerLink;
            this.$el_helper['c'].innerHTML = detail.css3Boxshadow;
            this.$el_helper['d'].innerHTML = detail.useiframe;
        },

        // init
        init: function() {
            this.initStyle();
            this.initDom();
        },

        toggle: function() {
            if (this.$el.classList.contains('m-performance-panel-hide')) {
                this.$el.classList.remove('m-performance-panel-hide');
            } else {
                this.$el.classList.add('m-performance-panel-hide');
            }

        }
    };

    _.circle.init();
    _.panel.init();

    (function refresh() {
        var rate = _.performace.rate();
        _.circle.renderRate(rate);
        _.panel.renderRate(rate);

        setTimeout(function() {
            refresh();
        }, 1000);
    }());


    // console.log('unuse img:', performace.unuseImgDownload());
    // console.log('link:', performace.outerLink());
    // console.log('css3:', performace.css3Boxshadow());
    // console.log('iframe:', performace.useIframe());

});