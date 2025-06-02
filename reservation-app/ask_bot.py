import io
import json
import sys

import torch
from sentence_transformers import SentenceTransformer, util

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
SIMILARITY_THRESHOLD = 0.65  
DOMAIN_KEYWORDS = ["réservation", "salle", "amphithéâtre", "espace", "réserver", 
                  "horaire", "disponibilité", "annuler", "modifier", "université",
                  "sousse", "calendrier", "réservé", "réservable", "booking"]

PROFESSIONAL_RESPONSES = {
    "greeting": "Bonjour ! Bienvenue sur la plateforme de réservation des espaces de l'Université de Sousse. Comment puis-je vous aider pour votre réservation aujourd'hui ?",
    "unknown": "Je n'ai pas compris votre demande concernant la réservation d'espaces. Pourriez-vous la reformuler en rapport avec notre service de réservation ?",
    "out_of_scope": "Je suis spécialisé dans la réservation des espaces universitaires (salles, amphithéâtres...). Pour toute autre question, je vous invite à consulter un site d'information généraliste.",
    "fallback": "Pour toute question sur la réservation d'espaces à l'Université de Sousse, n'hésitez pas à demander !",
}

# Checks if the user's question is outside the reservation domain scope 
def is_out_of_scope(question):
    """Détermine si la question est hors du domaine des réservations"""
    question_lower = question.lower()
    
    # Clearly off-topic questions
    out_of_scope_phrases = [
        "capitale de", "qui est", "combien fait", "quelle est la",
        "histoire de", "définition de", "âge de", "date de", "fête nationale"
    ]
    
    # Checks if the question relates to our domain
    contains_domain_keyword = any(keyword in question_lower for keyword in DOMAIN_KEYWORDS)
    
    # Checks if it's clearly off-topic
    is_general_knowledge = any(phrase in question_lower for phrase in out_of_scope_phrases)
    
    return is_general_knowledge and not contains_domain_keyword

# Loads the NLP model and training data from JSON file  
def load_model_and_data():
    """Charge le modèle et les données d'entraînement"""
    try:
        model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        
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
            
        prompt_embeddings = model.encode(prompts, convert_to_tensor=True)
        
        return model, prompts, completions, prompt_embeddings
        
    except Exception as e:
        print("Désolé, notre service de réservation rencontre un problème technique. Veuillez réessayer plus tard ou contacter le support.")
        sys.exit(1)
        
# Main function that handles user input and generates appropriate responses 
def main():
    # Loading resources
    model, prompts, completions, prompt_embeddings = load_model_and_data()
    
    # Handling user input
    if len(sys.argv) < 2:
        print(PROFESSIONAL_RESPONSES["greeting"])
        sys.exit(0)
    
    user_question = sys.argv[1]
    
    # Checking if the question is off-topic
    if is_out_of_scope(user_question):
        print(PROFESSIONAL_RESPONSES["out_of_scope"])
        sys.exit(0)
    
    # Detecting generic help requests
    if "aide" in user_question.lower() or "comment" in user_question.lower():
        print(PROFESSIONAL_RESPONSES["booking_help"])
        sys.exit(0)
    
    # Normal question processing
    question_embedding = model.encode(user_question, convert_to_tensor=True)
    similarities = util.pytorch_cos_sim(question_embedding, prompt_embeddings)
    best_match_score = torch.max(similarities).item()
    best_match_index = torch.argmax(similarities).item()
    
    if best_match_score >= SIMILARITY_THRESHOLD:
        print(completions[best_match_index])
    else:
        if "disponibilité" in user_question.lower():
            print("Vous pouvez vérifier la disponibilité des espaces sur notre calendrier en ligne après connexion.")
        elif "annuler" in user_question.lower():
            print("Pour annuler une réservation : 1) Allez dans 'Mes réservations' 2) Sélectionnez la réservation 3) Cliquez sur 'Annuler'. Besoin d'aide ?")
        elif any(keyword in user_question.lower() for keyword in ["réserv", "book"]):
            print(PROFESSIONAL_RESPONSES["booking_help"])
        else:
            print(PROFESSIONAL_RESPONSES["unknown"])

if __name__ == "__main__":
    main()