/* particles.js config — оптимизировано для мобильных */

var isMobile = window.innerWidth < 768;

particlesJS('particles-js', {
    "particles": {
        "number": {
            // На мобильном 30 частиц вместо 60 — в 2x меньше работы
            "value": isMobile ? 30 : 60,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "random"
            },
            "polygon": {
                "nb_sides": 1
            },
            "image": {
                "src": "img/github.svg",
                "width": 0,
                "height": 0
            }
        },
        "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 2.5,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 5,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": isMobile ? 120 : 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            // На мобильном скорость ниже — меньше перерисовок
            "speed": isMobile ? 1 : 2,
            "direction": "bottom",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "window",
        "events": {
            "onhover": {
                // На мобильном отключаем repulse — он вызывает постоянный пересчёт при касании
                "enable": !isMobile,
                "mode": "repulse"
            },
            "onclick": {
                "enable": false,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 400,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 150
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    // FIX: retina_detect: true на iPhone 15 Pro Max (3x) утраивает нагрузку
    "retina_detect": false
});