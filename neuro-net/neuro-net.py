import numpy as np

np.random.seed(42)

# Activation function: sigmoid (mimics neuron firing rate)
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# Derivative of sigmoid (needed for learning adjustments)
def sigmoid_derivative(x):
    s = sigmoid(x)
    return s * (1 - s)

# XOR dataset: inputs are like sensory signals
X = np.array([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
])

# Expected outputs: desired neuron firing pattern
y = np.array([
    [0],
    [1],
    [1],
    [0]
])

# Network architecture: layers of neurons
input_size = 2       # Number of input neurons (sensory neurons)
hidden_size = 2      # Number of hidden neurons (interneurons)
output_size = 1      # Number of output neurons (motor neuron)
learning_rate = 0.1
epochs = 10000

# Initialize synaptic weights and neuron thresholds (biases)
W1 = np.random.randn(input_size, hidden_size)  # Synapses from input to hidden layer
b1 = np.zeros((1, hidden_size))                # Thresholds for hidden neurons
W2 = np.random.randn(hidden_size, output_size) # Synapses from hidden to output neuron
b2 = np.zeros((1, output_size))                # Threshold for output neuron

for epoch in range(epochs):
    # -------- Forward pass: signal flow through the brain --------
    
    # Hidden layer: sum of inputs weighted by synapses + neuron threshold
    z1 = np.dot(X, W1) + b1
    # Hidden neuron firing rates (nonlinear activation)
    a1 = sigmoid(z1)
    
    # Output layer: sum of hidden neuron signals weighted by synapses + threshold
    z2 = np.dot(a1, W2) + b2
    # Output neuron firing rate
    a2 = sigmoid(z2)
    
    # -------- Calculate error (loss) --------
    # Difference between desired and actual firing pattern
    loss = np.mean((y - a2) ** 2)
    
    # -------- Backpropagation: adjust synapses to learn --------
    
    # How much output neuron firing needs to change
    d_loss_a2 = 2 * (a2 - y) / y.size
    # How sensitive output firing is to input signals (derivative)
    d_a2_z2 = sigmoid_derivative(z2)
    # Hidden neuron signals influence output neuron firing
    d_z2_W2 = a1
    
    # Error signal for output neuron
    d_loss_z2 = d_loss_a2 * d_a2_z2
    # How to adjust synapses from hidden to output neuron
    d_loss_W2 = np.dot(d_z2_W2.T, d_loss_z2)
    # How to adjust output neuron threshold
    d_loss_b2 = np.sum(d_loss_z2, axis=0, keepdims=True)
    
    # How output neuron error affects hidden neurons
    d_z2_a1 = W2
    d_loss_a1 = np.dot(d_loss_z2, d_z2_a1.T)
    # How sensitive hidden neuron firing is to input signals
    d_a1_z1 = sigmoid_derivative(z1)
    # Error signal for hidden neurons
    d_loss_z1 = d_loss_a1 * d_a1_z1
    # How to adjust synapses from input to hidden neurons
    d_loss_W1 = np.dot(X.T, d_loss_z1)
    # How to adjust hidden neuron thresholds
    d_loss_b1 = np.sum(d_loss_z1, axis=0, keepdims=True)
    
    # -------- Update synapses and thresholds (learning) --------
    # Strengthen or weaken synapses based on error signal
    W2 -= learning_rate * d_loss_W2
    b2 -= learning_rate * d_loss_b2
    W1 -= learning_rate * d_loss_W1
    b1 -= learning_rate * d_loss_b1
    
    # Print loss every 1000 epochs to monitor learning progress
    if epoch % 1000 == 0:
        print(f"Epoch {epoch}, Loss: {loss:.4f}")

# -------- Test the trained brain --------
print("\nPredictions after training:")
for x_input in X:
    # Forward pass for each input
    z1 = np.dot(x_input, W1) + b1
    a1 = sigmoid(z1)
    z2 = np.dot(a1, W2) + b2
    a2 = sigmoid(z2)
    print(f"Input: {x_input} => Predicted firing: {a2.round(3)}")
