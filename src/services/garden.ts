// Replace the mock adapter with REST requests in the next product phase.
export interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  source: "demo";
}
export const gardenService = {
  getWeather: async (): Promise<WeatherData> => ({
    city: "杭州",
    temperature: 24,
    condition: "晴间多云",
    source: "demo",
  }),
};
