export async function getModels() {
  try {
    const models = [];
    const response = await fetch('http://localhost:11435/api/tags');
    const data = await response.json();
    // {"models": [{ "name": "llama2:latest","modified_at": "2023-10-28T17:51:44.867165975-07:00","size": 3825819519,"digest": "fe938a131f40e6f6d40083c9f0f430a515233eb2edaa6d72eb85c50d64f2300e"}]}
    // we want to return the name of the model
    // so that we can use it in the dropdown selection
    for (let i = 0; i < data.models.length; i++) {
      // split the name of the model by the colon
      // and return the first element of the array
      models.push(data.models[i].name.split(':')[0]);
    }
    return models;
  } catch (error) {
    console.error(error);
    return [];
  }
}
