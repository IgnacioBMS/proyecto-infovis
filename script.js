let chart; // Para mantener referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta a tu archivo de audio
audio.loop = true; // Hacer que el audio se reproduzca en bucle
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausado
let intervalId; // Para guardar la referencia al intervalo de actualización
const velocidadFactor = 0.2; // Factor para ralentizar el avance por el gráfico

document.addEventListener('DOMContentLoaded', function () {
    const carDetails = document.getElementById('car-details');
    const carSpecs = document.getElementById('car-specs');
    const toggleVolumeButton = document.getElementById('toggle-volume');
    const volumeIcon = document.getElementById('volume-icon');
    const categorySelect = document.getElementById('category-select');

    let isVolumeTracking = false;

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

            categorySelect.addEventListener('change', function () {
                pausarAudio(); // Detener audio al cambiar de categoría
                const categoria = categorySelect.value;
                actualizarGrafico(categoria, data);
            });
        },
        error: function (err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico
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
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                    },
                    {
                        label: 'Progreso del Audio',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointRadius: 0
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

    // Función para mostrar los detalles del auto
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
                const audioProgress = (audio.currentTime / audio.duration) * velocidadFactor;
                const limitIndex = Math.floor(audioProgress * chart.data.labels.length);
                updateChartLine(limitIndex);
            }
        }, 200); // Actualizar cada 200ms
    }

    function pausarAudio() {
        audio.pause();
        isPlaying = false;
        volumeIcon.classList.remove('fa-pause');
        volumeIcon.classList.add('fa-play');
        clearInterval(intervalId);
    }

    // Función para actualizar el gráfico según el progreso del audio
    function updateChartLine(limitIndex) {
        const originalDataset = chart.data.datasets[0].data;
        chart.data.datasets[1].data = originalDataset.map((value, index) =>
            index <= limitIndex ? value : null
        );
        chart.update();
    }
});
