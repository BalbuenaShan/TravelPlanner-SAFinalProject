<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Allow all origins for Expo
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

// Database connection
$host = "localhost";
$user = "root";
$password = "";
$database = "travel_planner";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

// Get request
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Simple routing
if ($method == 'GET') {
    if (isset($_GET['action'])) {
        $action = $_GET['action'];
        
        if ($action == 'get_trips') {
            $result = $conn->query("SELECT * FROM trips ORDER BY created_at DESC");
            $trips = [];
            while($row = $result->fetch_assoc()) {
                $trips[] = $row;
            }
            echo json_encode($trips);
        }
        elseif ($action == 'get_activities' && isset($_GET['trip_id'])) {
            $trip_id = intval($_GET['trip_id']);
            $stmt = $conn->prepare("SELECT * FROM activities WHERE trip_id = ? ORDER BY day_number, id");
            $stmt->bind_param("i", $trip_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $activities = [];
            while($row = $result->fetch_assoc()) {
                $activities[] = $row;
            }
            echo json_encode($activities);
        }
    }
}
elseif ($method == 'POST') {
    $data = $input;
    
    if (isset($data['action'])) {
        if ($data['action'] == 'add_trip') {
            $stmt = $conn->prepare("INSERT INTO trips (destination, start_date, end_date, notes) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", 
                $data['destination'],
                $data['start_date'],
                $data['end_date'],
                $data['notes']
            );
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $stmt->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
        elseif ($data['action'] == 'add_activity') {
            $stmt = $conn->prepare("INSERT INTO activities (trip_id, activity_name, day_number) VALUES (?, ?, ?)");
            $stmt->bind_param("isi", 
                $data['trip_id'],
                $data['activity_name'],
                $data['day_number']
            );
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "id" => $stmt->insert_id]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
    }
}
elseif ($method == 'PUT') {
    $data = $input;
    
    if (isset($data['action'])) {
        if ($data['action'] == 'update_trip') {
            // UPDATE existing trip
            $stmt = $conn->prepare("UPDATE trips SET destination = ?, start_date = ?, end_date = ?, notes = ? WHERE id = ?");
            $stmt->bind_param("ssssi", 
                $data['destination'],
                $data['start_date'],
                $data['end_date'],
                $data['notes'],
                $data['trip_id']
            );
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
        elseif ($data['action'] == 'toggle_activity') {
            // Toggle activity done/not done
            $stmt = $conn->prepare("UPDATE activities SET is_done = ? WHERE id = ?");
            $stmt->bind_param("ii", $data['is_done'], $data['activity_id']);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
        elseif ($data['action'] == 'update_activity') {
            // Optional: Add activity editing later
            $stmt = $conn->prepare("UPDATE activities SET activity_name = ?, day_number = ? WHERE id = ?");
            $stmt->bind_param("sii", 
                $data['activity_name'],
                $data['day_number'],
                $data['activity_id']
            );
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
    }
}
elseif ($method == 'DELETE') {
    $data = $input;
    
    if (isset($data['action'])) {
        if ($data['action'] == 'delete_trip') {
            // Delete trip (cascade will delete activities automatically)
            $stmt = $conn->prepare("DELETE FROM trips WHERE id = ?");
            $stmt->bind_param("i", $data['trip_id']);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
        elseif ($data['action'] == 'delete_activity') {
            // Optional: Delete single activity
            $stmt = $conn->prepare("DELETE FROM activities WHERE id = ?");
            $stmt->bind_param("i", $data['activity_id']);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => $stmt->error]);
            }
        }
    }
}

$conn->close();
?>