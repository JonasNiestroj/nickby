export default async () => {
  const data = await fetch('https://swapi.dev/api/planets/2');
  const json = await data.json();
  return { data: json };
};
