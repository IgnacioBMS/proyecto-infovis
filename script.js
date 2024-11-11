let chart; // Referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta al archivo de audio
audio.loop = true; // El audio se reproduce en bucle
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausa
let intervalId; // Para guardar la referencia del intervalo
const volumenMin = 0.1; // Volumen mínimo (10%)
const volumenMax = 1;   // Volumen máximo (100%)
const velocidadFactor = 0.5; // Factor para ajustar el avance en el gráfico

document.addEventListener('DOMContentLoaded', function () {
    const carDetails = document.getElementById('car-details');
    const carSpecs = document.getElementById('car-specs');
    const toggleVolumeButton = document.getElementById('toggle-volume');
    const volumeIcon = document.getElementById('volume-icon');
    const categorySelect = document.getElementById('category-select');

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function (results) {
            const data = results.data.map(item => ({
                Name: item.Name,
                Price: parseInt(item.PriceinEurope),
                Battery_kWh: parseFloat(item.Battery_kWh),
                Acceleration_sec: parseFloat(item.Acceleration_sec),
                TopSpeed_kmh: parseFloat(item.TopSpeed_kmh),
                Range_km: parseFloat(item.Range_km),
                Efficiency_Whkm: parseFloat(item.Efficiency_Whkm),
                NumberofSeats: parseInt(item.NumberofSeats),
                Score: Math.trunc(parseFloat(item.Score) * 100),
            }));

            actualizarGrafico('Score', data);
            mostrarDetallesAuto(data[0]);

            // Evento para cambiar de categoría
            categorySelect.addEventListener('change', function () {
                pausarAudio(); // Detener el audio y reiniciar el progreso
                const categoria = categorySelect.value;
                actualizarGrafico(categoria, data);
                reiniciarAudio(); // Reiniciar el audio y su progreso
                reiniciarColorLinea(); // Reiniciar el color de la línea del gráfico
            });
        },
        error: function (err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico según la categoría seleccionada
    function actualizarGrafico(categoria, data) {
        const precios = data.map(item => item.Price);
        const valores = data.map(item => item[categoria]);

        if (chart) {
            chart.destroy();
        }

        const ctx = document.getElementById('line-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: precios,
                datasets: [
                    {
                        label: categoria,
                        data: valores,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Precio en Europa'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: categoria
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                const valor = context[0].raw;
                                return valor ? valor.toFixed(2) : '';
                            },
                            label: function (context) {
                                const index = context.dataIndex;
                                const name = data[index] ? data[index].Name : '';
                                const price = context.label;
                                return `${name}: €${parseFloat(price).toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Mostrar detalles del auto
    function mostrarDetallesAuto(car) {
        carDetails.style.display = 'block';
        carSpecs.innerHTML = `
            <strong>Nombre:</strong> ${car.Name}<br>
            <strong>Precio:</strong> €${car.Price.toLocaleString()}<br>
            <strong>Batería:</strong> ${car.Battery_kWh} kWh<br>
            <strong>Aceleración:</strong> ${car.Acceleration_sec} segundos<br>
            <strong>Velocidad Máxima:</strong> ${car.TopSpeed_kmh} km/h<br>
            <strong>Autonomía:</strong> ${car.Range_km} km<br>
            <strong>Gasto:</strong> ${car.Efficiency_Whkm} Wh/km<br>
            <strong>Número de Asientos:</strong> ${car.NumberofSeats}<br>
            <strong>Puntuación:</strong> ${car.Score} / 100<br>
        `;
    }

    // Control de audio y seguimiento
    toggleVolumeButton.addEventListener('click', function () {
        if (isPlaying) {
            pausarAudio();
        } else {
            reproducirAudio();
        }
    });

    function reproducirAudio() {
        audio.play();
        isPlaying = true;
        volumeIcon.classList.remove('fa-play');
        volumeIcon.classList.add('fa-pause');

        intervalId = setInterval(() => {
            if (chart) {
                const audioProgress = (audio.currentTime / audio.duration);
                const limitIndex = Math.floor(audioProgress * chart.data.labels.length);
                updateChartLine(limitIndex);
                ajustarVolumen(audioProgress);
            }
        }, 300); // Actualiza cada 300ms
    }

    function pausarAudio() {
        audio.pause();
        isPlaying = false;
        volumeIcon.classList.remove('fa-pause');
        volumeIcon.classList.add('fa-play');
        clearInterval(intervalId);
    }

    // Reiniciar el audio
    function reiniciarAudio() {
        audio.currentTime = 0; // Reinicia el audio al principio
        audio.play(); // Comienza a reproducir nuevamente
        isPlaying = true;
        volumeIcon.classList.remove('fa-play');
        volumeIcon.classList.add('fa-pause');
    }

    // Función para actualizar la línea según el progreso
    function updateChartLine(limitIndex) {
        chart.data.datasets[0].pointBackgroundColor = chart.data.labels.map((_, index) =>
            index <= limitIndex ? 'rgba(255, 0, 0, 1)' : 'rgba(75, 192, 192, 1)'
        );
        chart.update();
    }

    // Función para ajustar el volumen según el progreso del audio
    function ajustarVolumen(progress) {
        const volumen = volumenMin + (volumenMax - volumenMin) * progress;
        audio.volume = volumen;
    }

    // Función para restablecer el gráfico original
    function reiniciarColorLinea() {
        if (chart) {
            chart.data.datasets[0].pointBackgroundColor = chart.data.labels.map(() => 'rgba(75, 192, 192, 1)');
            chart.update();
        }
    }
});
