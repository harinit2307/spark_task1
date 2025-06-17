# main.py
from elevenlabs import ElevenLabsClient, play
import os
from dotenv import load_dotenv

load_dotenv()

client = ElevenLabsClient(api_key=os.getenv("ELEVENLABS_API_KEY"))

def generate_audio(text: str, filename: str = "output.mp3"):
    audio = client.text_to_speech.convert(
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        text=text,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128"
    )
    with open(filename, "wb") as f:
        f.write(audio)
    print(f"✅ Audio saved as {filename}")
    # Optional: play(audio) if ffplay is installed

if __name__ == "__main__":
    generate_audio("Hello, this is a test.")
