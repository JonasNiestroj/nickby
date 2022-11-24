export default async () => {
  const data = await fetch('https://swapi.dev/api/planets/1');
  const json = await data.json();
  return { data: json };
};
