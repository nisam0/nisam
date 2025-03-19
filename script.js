// Initialize Supabase client
const supabaseUrl = 'https://lsurggcdtfowaltulmxr.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXJnZ2NkdGZvd2FsdHVsbXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDAzMTcsImV4cCI6MjA1Nzg3NjMxN30.wFM5ga7dHgwZbpLHa2OcjGM2PBxmVybkbSb1srZK-zI'; // Replace with your Supabase anon key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Get form and message elements
const form = document.getElementById('addBookForm');
const messageDiv = document.getElementById('message');

// Add event listener for form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    try {
        // Validate form inputs
        validateForm();

        // Extract form values
        const bookId = document.getElementById('bookId').value.trim();
        const title = document.getElementById('title').value.trim();
        const author = document.getElementById('author').value.trim();
        const year = document.getElementById('year').value.trim()
            ? parseInt(document.getElementById('year').value.trim(), 10)
            : null;
        const shelf = parseInt(document.getElementById('shelf').value.trim(), 10);
        const row = parseInt(document.getElementById('row').value.trim(), 10);
        const position = parseInt(document.getElementById('position').value.trim(), 10);
        const topicsInput = document.getElementById('topics').value.trim();
        const topics = topicsInput
            .split(',')
            .map((topic) => topic.trim())
            .filter((topic) => topic !== '');

        // Step 1: Insert book into the 'books' table
        const { data: bookData, error: bookError } = await supabase
            .from('books')
            .insert([{ book_id: bookId, title, author, publication_year: year }])
            .select('book_id'); // Ensure we get the inserted book ID back

        if (bookError) throw bookError;

        // Step 2: Insert location into the 'book_locations' table
        const { error: locationError } = await supabase
            .from('book_locations')
            .insert([{ book_id: bookId, shelf_number: shelf, row_number: row, position_number: position }]);

        if (locationError) throw locationError;

        // Step 3: Process topics
        for (const topic of topics) {
            let topicId;

            // Check if the topic already exists in the 'topics' table
            const { data: topicData, error: topicError } = await supabase
                .from('topics')
                .select('topic_id')
                .eq('topic_name', topic)
                .single();

            if (topicError && topicError.message.includes('No rows found')) {
                // Topic doesn't exist, create it
                const { data: newTopic, error: createTopicError } = await supabase
                    .from('topics')
                    .insert([{ topic_name: topic }])
                    .select('topic_id') // Automatically generate and retrieve the new topic ID
                    .single();

                if (createTopicError) throw createTopicError;
                topicId = newTopic.topic_id; // Use the newly generated topic ID
            } else if (topicError) {
                throw topicError; // Handle unexpected errors
            } else {
                topicId = topicData.topic_id; // Use the existing topic ID
            }

            // Link the book to the topic in the 'book_topics' table
            const { error: bookTopicError } = await supabase
                .from('book_topics')
                .insert([{ book_id: bookId, topic_id: topicId }]);

            if (bookTopicError) throw bookTopicError;
        }

        // Show success message
        messageDiv.className = 'success';
        messageDiv.textContent = `Book "${title}" added successfully!`;

        // Reset form
        form.reset();
    } catch (error) {
        console.error('Error:', error);
        messageDiv.className = 'error';
        messageDiv.textContent = `Error: ${error.message || 'Something went wrong'}`;
    }
});

// Input Validation Function
const validateForm = () => {
    const bookId = document.getElementById('bookId').value.trim();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const shelf = parseInt(document.getElementById('shelf').value.trim(), 10);
    const row = parseInt(document.getElementById('row').value.trim(), 10);
    const position = parseInt(document.getElementById('position').value.trim(), 10);

    if (!bookId || !title || !author) {
        throw new Error('Book ID, Title, and Author are required fields.');
    }
    if (isNaN(shelf) || shelf <= 0) {
        throw new Error('Shelf number must be a positive integer.');
    }
    if (isNaN(row) || row <= 0) {
        throw new Error('Row number must be a positive integer.');
    }
    if (isNaN(position) || position <= 0) {
        throw new Error('Position number must be a positive integer.');
    }
};