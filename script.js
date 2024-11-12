let chart; // Referencia al gráfico
let audio = new Audio('audio/audio.mp3'); // Ruta al archivo de audio
audio.loop = true; // Se activa el bucle para que el audio se reproduzca continuamente
let isPlaying = false; // Estado para controlar si el audio está en reproducción o pausa
let intervalId; // Para guardar la referencia del intervalo
let currentIndex = 0; // Índice para el progreso del audio
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
                reiniciarProgreso(); // Restablecer la línea de progreso
                actualizarGrafico(categorySelect.value, data); // Actualizar el gráfico con la nueva categoría
                pausarAudio(); // Pausar el audio al cambiar de categoría
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
    
        // Determinar valores mínimo y máximo con límite entre 10 y 100
        const minValor = Math.max(10, Math.min(...valores));
        const maxValor = Math.min(100, Math.max(...valores));
    
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
                        borderColor: 'rgba(75, 192, 192, 1)', // Color original
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
                    },
                    {
                        label: 'Progreso del Audio',
                        data: new Array(valores.length).fill(null), // Inicialmente vacía
                        borderColor: 'rgba(255, 99, 132, 1)', // Color de la línea de progreso
                        borderWidth: 2,
                        fill: false,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        borderDash: [5, 5] // Línea discontinua para visibilidad
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
                        min: minValor - 10,
                        max: maxValor + 10,
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
                },
                // Al hacer clic en un punto del gráfico, mostrar los detalles del auto
                onClick: function (e, item) {
                    if (item.length > 0) {
                        const index = item[0].index; // Obtener el índice del auto
                        const car = data[index]; // Obtener los datos del auto
    
                        // Mostrar las especificaciones del auto
                        carDetails.style.display = 'block'; // Hacer visible el contenedor
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

        currentIndex = 0; // Reinicia el índice de progreso
        intervalId = setInterval(() => {
            if (chart) {
                const totalPoints = chart.data.labels.length;
                actualizarProgresoAudio(currentIndex);
                ajustarVolumen(currentIndex / totalPoints);
                currentIndex = (currentIndex + 1) % totalPoints; // Incrementar y ciclar el índice
            }
        }, 700); // Actualiza cada 300ms
    }

    function pausarAudio() {
        audio.pause();
        isPlaying = false;
        volumeIcon.classList.remove('fa-pause');
        volumeIcon.classList.add('fa-play');
        clearInterval(intervalId);
    }

    // Función para actualizar la línea de progreso del audio
    function actualizarProgresoAudio(limitIndex) {
        const progressData = chart.data.datasets[1].data;
        for (let i = 0; i < progressData.length; i++) {
            progressData[i] = i <= limitIndex ? chart.data.datasets[0].data[i] : null;
        }
        chart.update();
    }

    // Función para reiniciar el progreso de la línea del audio
    function reiniciarProgreso() {
        if (chart) {
            chart.data.datasets[1].data = new Array(chart.data.datasets[0].data.length).fill(null);
            chart.update();
        }
    }

    // Función para ajustar el volumen según el progreso del gráfico
    function ajustarVolumen(progress) {
        audio.volume = progress; // Volumen aumenta de 0 a 1 según el progreso en el gráfico
    }
});
