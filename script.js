let chart;  // Para mantener referencia al gráfico

document.addEventListener('DOMContentLoaded', function() {
    const carDetails = document.getElementById('car-details'); // Contenedor para los detalles del auto
    const carSpecs = document.getElementById('car-specs'); // Donde se mostrarán las especificaciones

    // Cargar el CSV
    Papa.parse('datos/database.csv', {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data.map(item => {
                return {
                    Name: item.Name,
                    Price: parseInt(item.PriceinEurope), // Convertir a número
                    Battery_kWh: parseFloat(item.Battery_kWh),
                    Acceleration_sec: parseFloat(item.Acceleration_sec),
                    TopSpeed_kmh: parseFloat(item.TopSpeed_kmh),
                    Range_km: parseFloat(item.Range_km),
                    Efficiency_Whkm: parseFloat(item.Efficiency_Whkm),
                    NumberofSeats: parseInt(item.NumberofSeats),
                    Score: Math.trunc(parseFloat(item.Score) * 100),
                };
            });

            // Inicializar el gráfico con la categoría por defecto
            actualizarGrafico('Battery_kWh', data);

            // Agregar un evento para cambiar el gráfico cuando se seleccione una nueva categoría
            const categorySelect = document.getElementById('category-select');
            categorySelect.addEventListener('change', function() {
                const categoria = categorySelect.value;
                actualizarGrafico(categoria, data); // Actualiza el gráfico con la nueva categoría seleccionada
            });
        },
        error: function(err) {
            console.error('Error al cargar el archivo CSV:', err);
        }
    });

    // Función para actualizar el gráfico según la categoría seleccionada
    function actualizarGrafico(categoria, data) {
        const precios = data.map(item => item.Price); // Obtiene los precios
        const valores = data.map(item => item[categoria]); // Obtiene los valores de la categoría seleccionada

        // Si ya existe un gráfico, destrúyelo antes de crear uno nuevo
        if (chart) {
            chart.destroy();
        }

        // Crear el gráfico
        const ctx = document.getElementById('line-chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: precios, // Usar los precio de los autos en el eje X
                datasets: [{
                    label: categoria,
                    data: valores, // Datos de la categoría en el eje Y
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    hoverBackgroundColor: 'rgba(255, 99, 132, 0.2)',
                    hoverBorderColor: 'rgba(255, 99, 132, 1)',
                }]
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
                // Personalización del tooltip para mostrar el nombre del auto y el precio
                plugins: {
                    tooltip: {
                        callbacks: {
                            // El título el valor del eje Y (el dato graficado)
                            title: function(context) {
                                const valor = context[0].raw; // Obtener el valor del eje Y
                                return valor.toFixed(2); // Muestra el valor del eje Y como título
                            },
                            // La etiqueta el nombre del auto y su precio
                            label: function(context) {
                                const index = context.dataIndex;
                                const name = data[index].Name; // Obtener el nombre del auto
                                const price = context.label; // Obtener el precio (eje X)
                                return `${name}: €${parseFloat(price).toLocaleString()}`;
                            }
                        }
                    }
                },
                // Al hacer clic en un punto del gráfico, mostrar los detalles del auto
                onClick: function(e, item) {
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
                            <strong>Puntuación:</strong> ${car.Score}<br>
                        `;
                    }
                }
            }
        });
    }
});