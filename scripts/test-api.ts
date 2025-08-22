async function testAPI() {
  const response = await fetch('http://localhost:3000/api/disease-data?disease=acute%20diarrheal%20disease&view=district')
  const data = await response.json()
  console.log(JSON.stringify(data, null, 2))
}

testAPI() 