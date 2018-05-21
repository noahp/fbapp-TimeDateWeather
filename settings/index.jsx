function timeDateWeather(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">TimeDateWeather Settings</Text>}>
        <Select
          label={`CelsiusOrFahrenheit`}
          settingsKey="CelsiusOrFahrenheit"
          options={[
            {name:"Celsius"},
            {name:"Fahrenheit"}
          ]}
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(timeDateWeather);
