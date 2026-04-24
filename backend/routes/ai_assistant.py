"""
AI Assistant Route
Role-aware AI assistant with fallback responses when API unavailable
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
import random

ai_bp = Blueprint('ai', __name__)

# Fallback responses by role and context
STUDENT_RESPONSES = [
    "Great question! Let me help you understand this concept. The key idea here is to break it down into smaller steps. Start with the fundamentals and build up from there.",
    "This is a fascinating topic! In CBSE curriculum, this is typically covered in relation to real-world applications. Try visualizing the concept with a diagram.",
    "Excellent thinking! The best approach here is to use the CBSE-approved method: understand the concept, practice with examples, and apply it to problems.",
    "I can help with that! Remember, understanding 'why' is more important than memorizing 'how'. Think about the underlying principle first.",
]

TEACHER_RESPONSES = [
    "Based on the student's learning pattern, I recommend using differentiated instruction. For struggling students, try breaking concepts into smaller chunks and using more visual aids.",
    "Consider implementing peer learning strategies. Group fast learners with average learners — it benefits both groups. For slow learners, provide additional one-on-one attention.",
    "A research-backed approach: use formative assessments every 2 weeks to identify gaps early. This allows timely intervention before patterns solidify.",
    "For this class composition, I'd suggest a blended approach: direct instruction for new concepts, collaborative activities for practice, and independent work for application.",
]

ADMIN_RESPONSES = [
    "Based on the school analytics, attendance trends show typical patterns. Consider implementing an automated early-warning system for students with attendance below 75%.",
    "The performance data suggests certain grades may benefit from additional teaching support. Cross-referencing ML predictions with actual grades can identify intervention priorities.",
    "For school improvement, focus on three key metrics: attendance consistency, formative assessment frequency, and teacher-student ratio optimization.",
]


def try_ai_api(messages, system_prompt):
    """
    Attempt to call AI API. Falls back gracefully if unavailable.
    In production, integrate OpenAI or HuggingFace here.
    """
    # Try to use a simple response since no API key is configured
    # In production, uncomment and configure OpenAI/HuggingFace
    
    # import os
    # api_key = os.getenv('OPENAI_API_KEY')
    # if api_key:
    #     import openai
    #     client = openai.OpenAI(api_key=api_key)
    #     response = client.chat.completions.create(
    #         model="gpt-3.5-turbo",
    #         messages=[{"role": "system", "content": system_prompt}] + messages,
    #         max_tokens=500
    #     )
    #     return response.choices[0].message.content
    
    return None  # Falls through to fallback


@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """AI assistant chat endpoint - role-aware responses"""
    claims = get_jwt()
    role = claims.get('role', 'student')
    user_id = get_jwt_identity()
    
    data = request.get_json()
    user_message = data.get('message', '').strip()
    conversation_history = data.get('history', [])
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    # System prompts by role
    system_prompts = {
        'student': """You are a helpful AI study assistant for students at Vidya Jyothi CBSE School in Tamil Nadu.
            Rules: Help students understand concepts. Give study guidance. Never give direct exam answers.
            Encourage critical thinking. Use simple, age-appropriate language. Reference CBSE curriculum.
            Be encouraging and positive. If asked about exam answers, guide them to think through the problem.""",
        
        'teacher': """You are an AI teaching assistant for teachers at Vidya Jyothi CBSE School.
            Help with: Teaching strategies, identifying struggling students, lesson planning,
            differentiated instruction, assessment design, parent communication.
            Provide evidence-based educational recommendations. Be concise and practical.""",
        
        'admin': """You are an AI analytics assistant for school administrators.
            Help with: Interpreting school data, suggesting improvements, policy recommendations,
            resource allocation, performance trend analysis. Be data-driven and strategic.""",
        
        'parent': """You are a helpful assistant for parents at Vidya Jyothi CBSE School.
            Help with: Understanding child's progress, homework support strategies, 
            communication tips for talking to teachers. Be supportive and informative."""
    }
    
    system_prompt = system_prompts.get(role, system_prompts['student'])
    
    # Prepare messages for API
    messages = conversation_history + [{"role": "user", "content": user_message}]
    
    # Try AI API
    ai_response = try_ai_api(messages, system_prompt)
    
    # Generate contextual fallback if API unavailable
    if not ai_response:
        ai_response = generate_contextual_response(user_message, role)
    
    return jsonify({
        'response': ai_response,
        'role': role,
        'model': 'contextual-fallback'
    }), 200


def generate_contextual_response(message: str, role: str) -> str:
    """Generate a contextual fallback response based on message content"""
    message_lower = message.lower()
    
    # Student-specific responses
    if role == 'student':
        if any(w in message_lower for w in ['explain', 'what is', 'how does', 'define']):
            return f"""I'd be happy to help you understand this concept! 

Here's a structured approach to studying this topic:

**Step 1: Understand the Basics**
Start by reading your NCERT textbook chapter carefully. Note down key terms and definitions.

**Step 2: Make Notes**
Create your own summary using simple language. Drawing diagrams always helps!

**Step 3: Practice**
Work through the solved examples in your textbook, then try the exercises.

**Step 4: Review**
After 24 hours, review your notes to reinforce memory.

Is there a specific part of this topic you'd like me to help clarify further? 📚"""
        
        elif any(w in message_lower for w in ['help', 'stuck', 'difficult', 'hard']):
            return """Don't worry — every student faces challenges, and that's completely normal! 

Here are some strategies that really work:

🎯 **Break it down**: Divide the problem into smaller steps. Focus on one part at a time.

🔄 **Review prerequisites**: Sometimes we need to revisit earlier concepts before new ones make sense.

📝 **Practice with examples**: Work through 2-3 solved examples carefully before trying on your own.

🤝 **Ask for help**: Talk to your teacher during free periods — they're always willing to help!

💡 **Use visual aids**: Try drawing diagrams or flowcharts to visualize concepts.

What specific topic are you finding difficult? Share more details and I'll give you targeted guidance!"""
        
        elif any(w in message_lower for w in ['exam', 'test', 'marks', 'score']):
            return """Great that you're thinking ahead about exams! Here's a proven CBSE exam preparation strategy:

📅 **4 Weeks Before:**
- Complete your full syllabus revision
- Focus on high-weightage chapters

📅 **2 Weeks Before:**
- Solve previous year question papers
- Practice time management during mock tests

📅 **1 Week Before:**
- Quick revision of formulas and key points
- Get adequate sleep — it boosts memory retention!

📅 **Day Before:**
- Light revision only — no new topics
- Organize your stationery and documents
- Sleep by 10 PM!

Remember: Consistent preparation beats last-minute cramming every time! What subject are you preparing for? 🎯"""
        
        else:
            return random.choice(STUDENT_RESPONSES) + "\n\nCould you tell me more about what specific aspect you need help with? I'm here to guide you through your studies! 📖"
    
    # Teacher responses
    elif role == 'teacher':
        if any(w in message_lower for w in ['struggling', 'slow', 'weak', 'behind']):
            return """**Intervention Strategies for Struggling Students:**

🎯 **Immediate Actions:**
- Schedule 10-minute one-on-one check-ins weekly
- Assign peer tutors from high-performing students
- Provide modified versions of assignments with scaffolding

📊 **Assessment Approach:**
- Use formative assessments every 2 weeks to track progress
- Focus on growth metrics, not just absolute scores
- Celebrate small improvements publicly

🏠 **Parent Engagement:**
- Schedule a parent meeting to align on home support
- Provide specific activities parents can do at home
- Share weekly progress updates via the parent portal

💡 **Instructional Strategies:**
- Use visual aids, real-world examples, and hands-on activities
- Break lessons into 10-minute segments for better retention
- Offer multiple ways to demonstrate understanding

Would you like specific strategies for a particular subject or student?"""
        
        elif any(w in message_lower for w in ['lesson', 'plan', 'teach', 'activity']):
            return """**Effective Lesson Planning for CBSE:**

📋 **Lesson Structure (50 minutes):**
- 5 min: Review previous lesson (quick Q&A)
- 10 min: Introduction with real-world connection
- 20 min: Core concept delivery with examples
- 10 min: Guided practice (you do together)
- 5 min: Independent practice check
- 5 min: Summary and preview of next class

🎨 **Differentiation Strategies:**
- **Fast learners**: Extension activities, higher-order questions
- **Average learners**: Standard practice with support
- **Slow learners**: Simplified examples, visual aids, peer support

📱 **Technology Integration:**
- Use Khan Academy clips for visual explanations
- Google Classroom for assignments and feedback
- Exit ticket forms for quick formative checks

What subject and grade level are you planning for? I can give more specific suggestions!"""
        
        else:
            return random.choice(TEACHER_RESPONSES) + "\n\nLet me know if you need more specific advice for your classroom!"
    
    # Admin responses
    elif role == 'admin':
        return random.choice(ADMIN_RESPONSES) + "\n\nFor more detailed analysis, check the Analytics section in the admin dashboard."
    
    # Parent responses
    else:
        return """Welcome! I'm here to help you understand your child's progress and support their learning at home.

**Tips for Supporting Your Child:**

📚 **At Home:**
- Set a consistent study time daily (1-2 hours after school)
- Create a quiet, distraction-free study space
- Check and sign homework books regularly

🗣️ **Communication:**
- Ask your child what they learned today — it reinforces memory
- Contact the class teacher if you notice persistent difficulties
- Attend Parent-Teacher Meetings regularly

🎯 **Monitoring Progress:**
- Check the grades and attendance sections in this app regularly
- Look for improvement trends, not just single scores
- Celebrate effort, not just results!

Is there something specific about your child's progress you'd like to discuss?"""
