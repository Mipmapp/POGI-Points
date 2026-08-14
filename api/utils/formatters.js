// ============================================================
// ERROR HANDLING AND FORMATTING
// ============================================================

/**
 * Send a standard internal error response
 * Logs the error and returns a 500 status with user-friendly message
 * @param {Object} res - Express response object
 * @param {Error} err - Error object
 * @param {string} userMessage - Message to display to user
 * @returns {Object} JSON error response
 */
export function internalError(res, err, userMessage = 'An internal server error occurred.') {
    console.error('[Server Error]', err);
    return res.status(500).json({ message: userMessage });
}

/**
 * Format error message from validation or database error
 * @param {Error} err - Error object
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(err) {
    if (err.code === 11000) {
        // Duplicate key error
        const field = Object.keys(err.keyPattern)[0];
        return `${field} already exists`;
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return messages[0] || 'Validation failed';
    }

    if (err.name === 'CastError') {
        return 'Invalid ID format';
    }

    return err.message || 'An unexpected error occurred';
}

/**
 * Create a standardized error response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} additional - Additional fields to include
 * @returns {Object} Error response object
 */
export function createErrorResponse(statusCode, message, additional = {}) {
    return {
        success: false,
        status: statusCode,
        message,
        ...additional,
        timestamp: new Date().toISOString()
    };
}

/**
 * Create a standardized success response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Success response object
 */
export function createSuccessResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
}

/**
 * Format a student object for API response (remove sensitive fields)
 * @param {Object} student - Student document
 * @returns {Object} Formatted student object
 */
export function formatStudentForResponse(student) {
    if (!student) return null;

    const obj = student.toObject ? student.toObject() : Object.assign({}, student);
    
    // Remove sensitive fields
    delete obj.custom_password;
    delete obj.contributions;
    delete obj.__v;
    
    return obj;
}

/**
 * Format a master (admin) object for API response (remove sensitive fields)
 * @param {Object} master - Master document
 * @returns {Object} Formatted master object
 */
export function formatMasterForResponse(master) {
    if (!master) return null;

    const obj = master.toObject ? master.toObject() : Object.assign({}, master);
    
    // Remove sensitive fields
    delete obj.password;
    delete obj.__v;
    
    // Never leak raw face descriptors through generic responses
    if (Array.isArray(obj.face_descriptors)) {
        obj.face_descriptors_count = obj.face_descriptors.length;
        delete obj.face_descriptors;
    }
    
    return obj;
}
