import sys
import json
import torch
from sentence_transformers import SentenceTransformer, util
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load model once
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Load training data
with open("BotTrainingData.json", "r", encoding='utf-8') as f:
    data = json.load(f)

prompts = []
completions = []

for item in data:
    prompt_raw = item["prompt"]
    completion_raw = item["completion"]

    prompt = prompt_raw.split("||")[1].strip() if "||" in prompt_raw else prompt_raw.strip()
    completion = completion_raw.split("||")[1].strip().replace("FR: ", "") if "||" in completion_raw else completion_raw.strip().replace("FR: ", "")

    prompts.append(prompt)
    completions.append(completion)

# Encode once
prompt_embeddings = model.encode(prompts, convert_to_tensor=True)

# Get user input from command line
user_question = sys.argv[1]
question_embedding = model.encode(user_question, convert_to_tensor=True)
similarities = util.pytorch_cos_sim(question_embedding, prompt_embeddings)
best_match_index = torch.argmax(similarities).item()

# Output the best matching response
print(completions[best_match_index])
