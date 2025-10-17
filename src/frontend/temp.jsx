    const handleCitySelect = (cityName) => {
        setSelectedCity(cityName);
        if (!cityName) {
            setPrediction(null);
        }
    };