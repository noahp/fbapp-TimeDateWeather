function timeDateWeather(props) {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            TimeDateWeather Settings
          </Text>
        }
      >
        <Select
          label={`Celsius / Fahrenheit`}
          settingsKey="CelsiusOrFahrenheit"
          options={[{ name: "Celsius" }, { name: "Fahrenheit" }]}
        />
        <TextInput
          label="Open Weather Map API key"
          settingsKey="owm_apikey"
          placeholder="<default>"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(timeDateWeather);
