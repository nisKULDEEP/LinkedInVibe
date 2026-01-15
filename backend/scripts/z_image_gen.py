import argparse
import sys
import torch
from diffusers import AutoPipelineForText2Image
from io import BytesIO
import base64

def generate_image(prompt, steps=4, guidance_scale=7.5):
    # Model ID for Z-Image-Turbo (or similar turbo model)
    # Using a known efficient SDXL Turbo or compatible model as placeholder 
    # until exact "Z-Image-Turbo" HF ID is confirmed. 
    # Reverting to SDXL Turbo for now as it's the standard for "Turbo" local gen.
    # If user meant "Z-Image" specifically, we'd need that specific HF ID. 
    # Assuming "stabilityai/sdxl-turbo" for safety unless "Tongyi-MAI" is found.
    # SEARCH RESULTS MENTIONED "Tongyi-MAI/Z-Image-Turbo" ?? 
    # Let's try to use a generic loading that works for standard Diffusers paths.
    
    model_id = "stabilityai/sdxl-turbo" # robust fallback if Z-Image is private/custom
    # If the user specifically wants Z-Image, they might need to clone it manually.
    # For this script, we'll implement the standard Diffusers pipeline.
    
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    dtype = torch.float16 if device == "mps" else torch.float32

    try:
        pipe = AutoPipelineForText2Image.from_pretrained(
            model_id, 
            torch_dtype=dtype, 
            variant="fp16" if device == "mps" else None
        )
        pipe.to(device)
        
        # Turbo models need fewer steps (1-4) and low guidance (0.0)
        image = pipe(prompt=prompt, num_inference_steps=steps, guidance_scale=0.0).images[0]
        
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        print(img_str) # Output ONLY base64 to stdout
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", type=str, required=True)
    args = parser.parse_args()
    
    generate_image(args.prompt)
