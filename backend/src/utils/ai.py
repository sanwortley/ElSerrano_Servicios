import google.generativeai as genai
import json
from src.config import settings

def parse_order_text(text: str):
    if not settings.GEMINI_API_KEY:
        return {"error": "No Gemini API Key configured."}

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Simple auto-discovery of a working model
        # We prefer gemini-1.5-flash or gemini-2.0-flash
        model_name = 'gemini-1.5-flash'
        try:
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            if 'models/gemini-1.5-flash' in available_models:
                model_name = 'models/gemini-1.5-flash'
            elif 'models/gemini-2.0-flash' in available_models:
                model_name = 'models/gemini-2.0-flash'
            elif available_models:
                # Fallback to the first one available if our preferred ones aren't there
                model_name = available_models[0]
        except:
            pass # Use default if list fails

        model = genai.GenerativeModel(model_name)
        
        prompt = f"""
        Actúa como un asistente administrativo para una empresa de servicios llamada 'El Serrano'.
        Extrae datos de este mensaje:
        {text}
        
        Si el cliente indica un rango de horario (ej: "por la mañana", "tarde", "noche"), extraelo en 'horario_rango'. NO uses un horario fijo si es un rango.
        Si el cliente indica un rango de precio o monto (ej: "$180000 a $280000", dependiendo del tiempo o trabajo), extraelo en 'precio_rango'.
        Si el cliente menciona un barrio cerrado, country o número de lote (ej: "portería los milagros", "Lote 34"), ES VITAL que lo incluyas tal cual en la 'direccion'.

        Devuelve unicamente un JSON con estos campos:
        - nombre
        - telefono
        - direccion
        - tipo_servicio: ("Volquetes y contenedores para obra", "Venta de áridos, piedras y rellenos", "Desagotes y destapes de cañerías", "Alquiler de baños químicos", "Movimiento de suelo", "Alquiler de obradores", "Otros")
        - descripcion
        - horario_rango
        - precio_rango
        """
        
        response = model.generate_content(prompt)
        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"error": "IA ocupada (Límite alcanzado). Por favor, intenta de nuevo en 30 segundos."}
        return {"error": error_msg}
