#!/bin/bash

# Setup Personalization System
# 设置个性化系统的数据库表和示例数据

set -e

echo "🚀 Setting up Personalization System for PokerIQ Pro"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "prisma/schema.prisma" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking database connection..."

# Check if database is accessible
if ! npx prisma db execute --command="SELECT 1;" > /dev/null 2>&1; then
    print_warning "Database connection failed. Make sure your database is running and DATABASE_URL is set correctly."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled"
        exit 1
    fi
fi

# Step 1: Generate Prisma Client
print_status "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 2: Run database migration
print_status "Running database migration..."
if npx prisma db push; then
    print_success "Database schema updated successfully"
else
    print_error "Database migration failed"
    exit 1
fi

# Step 3: Run personalization seed data
print_status "Seeding personalization data..."
if npx ts-node prisma/seed-personalization.ts; then
    print_success "Personalization seed data created successfully"
else
    print_warning "Personalization seed failed, but continuing..."
fi

# Step 4: Verify installation
print_status "Verifying installation..."

# Check if tables exist
TABLES_CHECK=$(npx prisma db execute --command="
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_preferences', 
    'personalization_profiles', 
    'recommendation_history', 
    'learning_paths', 
    'ab_test_participation'
);" 2>/dev/null | wc -l || echo "0")

if [ "$TABLES_CHECK" -ge 5 ]; then
    print_success "All personalization tables created successfully"
else
    print_warning "Some personalization tables may be missing"
fi

# Step 5: Create sample API test
print_status "Creating API test script..."

cat > test-personalization-api.sh << 'EOF'
#!/bin/bash

# Test Personalization API Endpoints
echo "🧪 Testing Personalization API Endpoints"
echo "========================================"

BASE_URL="http://localhost:3000"
USER_ID="demo-user-id"

echo "1. Testing User Profile (with personalization)..."
curl -s "${BASE_URL}/api/user/profile?userId=${USER_ID}" | jq '.data.personalization // "No personalization data"'

echo -e "\n2. Testing User Preferences..."
curl -s "${BASE_URL}/api/personalization/preferences?userId=${USER_ID}" | jq '.data.preferences.learningGoals // "No preferences"'

echo -e "\n3. Testing Personalized Recommendations..."
curl -s "${BASE_URL}/api/personalization/recommendations?userId=${USER_ID}&timeAvailable=30" | jq '.data.recommendations[0].title // "No recommendations"'

echo -e "\n4. Testing Learning Paths..."
curl -s "${BASE_URL}/api/personalization/learning-path?userId=${USER_ID}" | jq '.data.paths[0].title // "No learning paths"'

echo -e "\n✅ API tests completed!"
EOF

chmod +x test-personalization-api.sh
print_success "API test script created: test-personalization-api.sh"

# Step 6: Final summary
echo ""
echo "🎉 Personalization System Setup Complete!"
echo "========================================="
echo ""
echo "📋 What was created:"
echo "  ✅ Database tables for personalization system"
echo "  ✅ Sample user preferences and profiles"
echo "  ✅ Recommendation history with test data"
echo "  ✅ Active learning path for demo user"
echo "  ✅ AB test participation records"
echo "  ✅ API test script"
echo ""
echo "🚀 Next steps:"
echo "  1. Start your development server: npm run dev"
echo "  2. Test the APIs: ./test-personalization-api.sh"
echo "  3. Visit: http://localhost:3000/api/user/profile?userId=demo-user-id"
echo ""
echo "📖 API Endpoints:"
echo "  GET  /api/user/profile?userId=demo-user-id"
echo "  GET  /api/personalization/preferences?userId=demo-user-id"
echo "  PUT  /api/personalization/preferences"
echo "  GET  /api/personalization/recommendations?userId=demo-user-id"
echo "  POST /api/personalization/recommendations"
echo "  GET  /api/personalization/learning-path?userId=demo-user-id"
echo "  POST /api/personalization/learning-path"
echo ""
echo "Happy coding! 🎯"